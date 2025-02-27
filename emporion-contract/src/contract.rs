use crate::{
    error::ContractError,
    msg::{
        exec::{ExecuteMsg, InstantiateMsg, MigrateMsg},
        query::QueryMsg,
    },
    state::{
        bnk::Bank,
        index::Index,
        order::Order,
        params::Params,
        product::Product,
        rating::{Mark, Rating},
    },
    CONTRACT_NAME, CONTRACT_VERSION,
};
use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    let index = Index::instantiate(&mut deps)?;
    let params = Params::instantiate(&mut deps, info, msg)?;
    let bank = Bank::instantiate(&mut deps, env)?;
    let resp = Response::new()
        .add_attributes(params)
        .add_attributes(bank)
        .add_attributes(index);

    Ok(resp)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateProduct(msg) => Product::exec_create(&mut deps, env, info, msg),
        ExecuteMsg::UpdateProduct(msg) => Product::exec_update(&mut deps, env, info, msg),
        ExecuteMsg::CreateBulkProducts(msg) => Product::exec_bulk_create(&mut deps, env, info, msg),
        ExecuteMsg::UpdateBulkProduct(msg) => Product::exec_bulk_update(&mut deps, env, info, msg),

        ExecuteMsg::CreateOrder(msg) => Order::exec_create(&mut deps, env, info, msg),
        ExecuteMsg::AcceptOrder(msg) => Order::exec_accept(&mut deps, env, info, msg),
        ExecuteMsg::CancelOrder(msg) => Order::exec_cancel(&mut deps, env, info, msg),
        ExecuteMsg::DisputeOrder(msg) => Order::exec_dispute(&mut deps, env, info, msg),
        ExecuteMsg::CompleteOrder(msg) => Order::exec_complete(&mut deps, env, info, msg),

        ExecuteMsg::UpsertRating(msg) => Rating::exec_upsert(&mut deps, env, info, msg),
        ExecuteMsg::UpdateParams(msg) => Params::exec_update(&mut deps, env, info, msg),
        ExecuteMsg::Distribute(msg) => Bank::exec_distribute(&mut deps, env, info, msg),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> Result<Binary, ContractError> {
    match msg {
        QueryMsg::GetParams(msg) => Params::query_get(&deps, msg),
        QueryMsg::GetDistribution(msg) => Bank::query_get(&deps, msg),

        QueryMsg::GetProduct(msg) => Product::query_get(&deps, msg),
        QueryMsg::ListAllProducts(msg) => Product::query_list(&deps, msg),
        QueryMsg::ListProductsFromUser(msg) => Product::query_list_by_addr(&deps, msg),

        QueryMsg::GetOrder(msg) => Order::query_get(&deps, msg),
        QueryMsg::ListAllOrders(msg) => Order::query_list(&deps, msg),
        QueryMsg::ListOrdersForUser(msg) => Order::query_for(&deps, msg),
        QueryMsg::ListOrdersFromUser(msg) => Order::query_from(&deps, msg),

        QueryMsg::GetRating(msg) => Rating::query_get(&deps, msg),
        QueryMsg::ListRatingsForUser(msg) => Rating::query_for(&deps, msg),
        QueryMsg::ListRatingsFromUser(msg) => Rating::query_from(&deps, msg),
        QueryMsg::ListRatingsByOrder(msg) => Rating::query_by_order(&deps, msg),
        QueryMsg::ListAllRatings(msg) => Rating::query_list(&deps, msg),
        QueryMsg::GetMark(msg) => Mark::query_get(&deps, msg),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> Result<Response, ContractError> {
    Ok(Response::default())
}

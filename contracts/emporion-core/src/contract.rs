use cosmwasm_std::{
    entry_point, from_json, Deps, DepsMut, Env, MessageInfo, QueryResponse, Response,
};

use crate::{
    error::ContractError,
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ReceiverExecuteMsg},
    state::{Bank, Blacklist, ContractParams, Order, Product, Review, User, VotingPower},
};

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    ContractParams::msg_instantiate(&mut deps, env, info, msg)?;
    Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> Result<QueryResponse, ContractError> {
    match msg {
        QueryMsg::Info {} => ContractParams::msg_query_info(deps),
        QueryMsg::Params {} => ContractParams::msg_query_params(deps),
        QueryMsg::TotalPowerAtHeight { height } => {
            VotingPower::msg_query_total_at_height(deps, env, height)
        }
        QueryMsg::VotingPowerAtHeight { address, height } => {
            VotingPower::msg_query_at_height(deps, env, address, height)
        }
        QueryMsg::Bank {} => Bank::msg_query(deps),
        QueryMsg::UserStats { addr } => User::msg_query_stats(deps, addr),
        QueryMsg::Order { order_id } => Order::msg_query_by_id(deps, order_id),
        QueryMsg::OrdersForSeller { addr, start_from } => {
            Order::msg_query_for(deps, addr, start_from)
        }
        QueryMsg::OrdersFromBuyer { addr, start_from } => {
            Order::msg_query_from(deps, addr, start_from)
        }
        QueryMsg::ReviewsOfReviewed { addr, start_from } => {
            Review::msg_query_reviews_of_reviewed(deps, addr, start_from)
        }
        QueryMsg::ReviewsFromReviewer { addr, start_from } => {
            Review::msg_query_reviews_from_reviewer(deps, addr, start_from)
        }
        QueryMsg::ReviewsOfProduct {
            product_id,
            start_from,
        } => Review::msg_query_product_reviews(deps, product_id, start_from),
        QueryMsg::ProductsOfSeller { addr, start_from } => {
            Product::msg_query_of(deps, addr, start_from)
        }
        QueryMsg::ProductAll { start_from } => Product::msg_query_all(deps, start_from),
        QueryMsg::ProductById { product_id } => Product::msg_query_by_id(deps, product_id),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Blacklist(addrs) => Blacklist::msg_blacklist(&mut deps, env, info, addrs),
        ExecuteMsg::Unblacklist(addrs) => Blacklist::msg_unblacklist(&mut deps, env, info, addrs),
        ExecuteMsg::Invest {} => User::msg_invest(&mut deps, env, info),
        ExecuteMsg::Divest { to_divest } => User::msg_divest(&mut deps, env, info, to_divest),
        ExecuteMsg::Withdraw {} => User::msg_withdraw(&mut deps, env, info),
        ExecuteMsg::CreateOrder(msg) => Order::msg_create(&mut deps, env, info, msg),
        ExecuteMsg::AddProductsToOrder { order_id, cart } => {
            Order::add_products(&mut deps, env, info, order_id, cart)
        }
        ExecuteMsg::FinalizeOrder { order_id } => Order::msg_finalize(&mut deps, info, order_id),
        ExecuteMsg::AcceptOrder { order_id } => Order::msg_accept(&mut deps, info, order_id),
        ExecuteMsg::RejectOrder { order_id } => Order::msg_reject(&mut deps, info, order_id),
        ExecuteMsg::FulfillOrder { order_id } => Order::msg_fulfill(&mut deps, env, info, order_id),
        ExecuteMsg::DisputeOrder { order_id } => Order::msg_dispute(&mut deps, info, order_id),
        ExecuteMsg::ReviewUser(msg) => Review::msg_review_user(&mut deps, info, msg),
        ExecuteMsg::ReviewProduct(msg) => Review::msg_review_product(&mut deps, info, msg),
        ExecuteMsg::ListProduct { product_id } => Product::msg_list(&mut deps, info, product_id),
        ExecuteMsg::UnListProduct { product_id } => {
            Product::msg_unlist(&mut deps, info, product_id)
        }
        ExecuteMsg::CreateProduct(msg) => Product::msg_create(&mut deps, info, msg),
        ExecuteMsg::DistributeRewards {} => Bank::msg_distribute_rewards(&mut deps, env, info),
        ExecuteMsg::WithdrawToDev { amount, to } => {
            Bank::msg_withdraw_dev_to(&mut deps, info, amount, to)
        }
        ExecuteMsg::UpdateParams(msg) => ContractParams::msg_update(&mut deps, env, info, msg),
        ExecuteMsg::UpdateAdmin { new_admin } => ContractParams::msg_update_admin(&mut deps, env, info, new_admin),
        ExecuteMsg::Receive(wrpr) => {
            let msg: ReceiverExecuteMsg = from_json(wrpr.msg)?;
            let sender = wrpr.sender;
            let amount = wrpr.amount;
            match msg {
                ReceiverExecuteMsg::Invest {} => {
                    User::msg_cw20_invest(&mut deps, env, info, sender, amount)
                }
                ReceiverExecuteMsg::CreateOrder(msg) => {
                    Order::msg_cw20_create(&mut deps, env, info, sender, amount, msg)
                }
                ReceiverExecuteMsg::AddProductsToOrder { order_id, cart } => {
                    Order::msg_cw20_add_products(
                        &mut deps, env, info, sender, order_id, cart, amount,
                    )
                }
                ReceiverExecuteMsg::CreateProduct(msg) => {
                    Product::msg_cw20_create(&mut deps, info, msg, sender, amount)
                }
            }
        }
    }
}

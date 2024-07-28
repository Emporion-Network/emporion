use cosmwasm_std::{
    entry_point, to_json_binary, Addr, Deps, DepsMut, Env, MessageInfo, QueryResponse, Response
};
use cw2::{get_contract_version, set_contract_version};
use cw_storage_plus::Item;

use crate::{
    error::ContractError,
    msg::{ExecuteMsg, InfoResponse, InstantiateMsg, QueryMsg, TotalPowerAtHeightResponse, VotingPowerAtHeightResponse},
};

pub(crate) const CONTRACT_NAME: &str = "crates.io:emporion-voting-module";
pub(crate) const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
pub const CORE_ADDR:Item<Addr> = Item::new("core_addr");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let addr = deps.api.addr_validate(&msg.core_address)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CORE_ADDR.save(deps.storage, &addr)?;
    Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> Result<QueryResponse, ContractError> {
    match msg {
        QueryMsg::Info {} => {
            let info = get_contract_version(deps.storage)?;
            Ok(to_json_binary(&InfoResponse { info })?)
        },
        QueryMsg::TotalPowerAtHeight { height } => {
            let core_addr = CORE_ADDR.load(deps.storage)?;
            //VotingPower::msg_query_total_at_height(deps, env, height)
            let response:TotalPowerAtHeightResponse = deps.querier.query_wasm_smart(core_addr, &QueryMsg::TotalPowerAtHeight { height })?;
            Ok(to_json_binary(&response)?)
        }
        QueryMsg::VotingPowerAtHeight { address, height } => {
            let core_addr = CORE_ADDR.load(deps.storage)?;
            let response:VotingPowerAtHeightResponse = deps.querier.query_wasm_smart(core_addr, &QueryMsg::VotingPowerAtHeight { height, address })?;
            Ok(to_json_binary(&response)?)
        }

    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    Ok(Response::new())
}

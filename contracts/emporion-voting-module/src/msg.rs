use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;
use cw2::ContractVersion;

///////////////////////
/// QueryResponses  ///
///////////////////////

#[cw_serde]
pub struct InfoResponse {
    pub info: ContractVersion,
}

#[cw_serde]
pub struct TotalPowerAtHeightResponse {
    pub power: Uint128,
    pub height: u64,
}

#[cw_serde]
pub struct VotingPowerAtHeightResponse {
    pub power: Uint128,
    pub height: u64,
}

///////////////////////
///    QueryMsg     ///
///////////////////////

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(InfoResponse)]
    Info {},

    #[returns(TotalPowerAtHeightResponse)]
    TotalPowerAtHeight { height: Option<u64> },

    #[returns(VotingPowerAtHeightResponse)]
    VotingPowerAtHeight {
        address: String,
        height: Option<u64>,
    },
}

///////////////////////
///   ExecuteMsg    ///
///////////////////////

#[cw_serde]
pub enum ExecuteMsg {}

///////////////////////
/// InstantiateMsg  ///
///////////////////////

#[cw_serde]
pub struct InstantiateMsg {
    pub core_address: String,
}

///////////////////////
///   MigrateMsg    ///
///////////////////////

#[cw_serde]
pub struct MigrateMsg {}

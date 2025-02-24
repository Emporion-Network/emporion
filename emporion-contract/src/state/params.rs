use crate::{
    error,
    error::ContractError,
    msg::exec::{InstantiateMsg, UpdateParamsMsg},
};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    to_json_binary, Addr, Decimal, Deps, DepsMut, Empty, Env, MessageInfo, QueryResponse, Response,
    Uint128,
};
use cw_storage_plus::Item;

use super::bnk::BankDistribution;

const PARAMS: Item<Params> = Item::new("params");

#[cw_serde]
pub struct Params {
    pub platform_fee: Decimal,
    pub publish_fee: Uint128,
    pub accepted_denom: String,
    pub distribution: BankDistribution,
    pub admin: Addr,
    pub rewards_distribution_address: Addr,
    pub fund_id: u64,
}

impl Params {
    pub fn instantiate(
        deps: &mut DepsMut,
        info: MessageInfo,
        msg: InstantiateMsg,
    ) -> Result<Vec<(impl Into<String>, impl Into<String>)>, ContractError> {
        if msg.platform_fee > Decimal::one() {
            return error!("Platform fee cannot be greater than 1");
        }
        msg.distribution.check()?;
        let rewards_distribution_address =
            deps.api.addr_validate(&msg.rewards_distribution_address)?;
        let res = Self {
            platform_fee: msg.platform_fee,
            publish_fee: msg.publish_fee,
            accepted_denom: msg.accepted_denom,
            distribution: msg.distribution,
            admin: info.sender,
            rewards_distribution_address,
            fund_id: msg.fund_id.into(),
        };
        res.save(deps)?;
        Ok(vec![
            ("action", "instantiate_params".to_string()),
            ("platform_fee", res.platform_fee.to_string()),
            ("publish_fee", res.publish_fee.to_string()),
            ("accepted_denom", res.accepted_denom.to_string()),
            ("distribution", format!("{:?}", res.distribution)),
            ("admin", res.admin.to_string()),
            (
                "rewards_distribution_address",
                res.rewards_distribution_address.to_string(),
            ),
        ])
    }

    pub fn exec_update(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        msg: UpdateParamsMsg,
    ) -> Result<Response, ContractError> {
        let mut params = Self::load(&deps.as_ref())?;
        if info.sender != params.admin {
            return Err(ContractError::Unauthorized {});
        }
        if let Some(v) = msg.platform_fee {
            if v > Decimal::one() {
                return error!("Platform fee cannot be greater than 1");
            }
            params.platform_fee = v;
        }
        if let Some(v) = msg.publish_fee {
            params.publish_fee = v;
        }
        if let Some(v) = msg.distribution {
            v.check()?;
            params.distribution = v;
        }
        if let Some(v) = msg.rewards_distribution_address {
            params.rewards_distribution_address = deps.api.addr_validate(&v)?;
        }
        if let Some(v) = msg.admin {
            params.admin = deps.api.addr_validate(&v)?;
        }
        params.save(deps)?;
        Ok(Response::new().add_attributes(vec![
            ("action", "update_params".to_string()),
            ("platform_fee", params.platform_fee.to_string()),
            ("publish_fee", params.publish_fee.to_string()),
            ("distribution", format!("{:?}", params.distribution)),
            ("admin", params.admin.to_string()),
            (
                "rewards_distribution_address",
                params.rewards_distribution_address.to_string(),
            ),
        ]))
    }

    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        PARAMS.save(deps.storage, self)?;
        Ok(())
    }

    pub fn load(deps: &Deps) -> Result<Self, ContractError> {
        Ok(PARAMS.load(deps.storage)?)
    }
    pub fn query_get(deps: &Deps, _msg: Empty) -> Result<QueryResponse, ContractError> {
        Ok(to_json_binary(&PARAMS.load(deps.storage)?)?)
    }
}

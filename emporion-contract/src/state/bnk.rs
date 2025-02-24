use crate::{error, error::ContractError, msg::exec::DistributeMsg};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    to_json_binary, wasm_execute, BankMsg, Coin, CosmosMsg, Decimal, Deps, DepsMut, Empty, Env,
    Fraction, MessageInfo, QueryResponse, Response, Uint128,
};
use cw_storage_plus::Item;

use super::params::Params;

const BANK: Item<Bank> = Item::new("bank");

#[cw_serde]
pub struct BankDistribution {
    rnd: Decimal,
    rewards: Decimal,
}

#[cw_serde]

enum FundMsg {
    Fund(Fund),
}

#[cw_serde]
pub struct Fund {
    pub id: u64,
}

impl BankDistribution {
    pub fn check(&self) -> Result<(), ContractError> {
        if self.rnd + self.rewards != Decimal::one() {
            return error!(
                "Invalid distribution, should sum up to 1 found {}",
                self.rnd + self.rewards
            );
        }
        Ok(())
    }
}

#[cw_serde]
pub struct Bank {
    pub rnd: Uint128,
    pub rewards: Uint128,
}

impl Bank {
    pub fn new() -> Self {
        Self {
            rnd: Uint128::zero(),
            rewards: Uint128::zero(),
        }
    }

    pub fn load(deps: &Deps) -> Result<Self, ContractError> {
        Ok(BANK.load(deps.storage)?)
    }

    pub fn instantiate(
        deps: &mut DepsMut,
        _env: Env,
    ) -> Result<Vec<(impl Into<String>, impl Into<String>)>, ContractError> {
        let bank = Bank::new();
        bank.save(deps)?;
        Ok(vec![("action", "instantiate_bank")])
    }

    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        BANK.save(deps.storage, &self)?;
        Ok(())
    }

    pub fn take_platform_fee(deps: &mut DepsMut, amount: Uint128) -> Result<Coin, ContractError> {
        let mut bank = BANK.load(deps.storage)?;
        let params = Params::load(&deps.as_ref())?;
        if amount == Uint128::zero() {
            return error!("Amount is zero");
        }
        let fee = amount.checked_multiply_ratio(
            params.platform_fee.numerator(),
            params.platform_fee.denominator(),
        )?;
        bank.rnd += fee.checked_multiply_ratio(
            params.distribution.rnd.numerator(),
            params.distribution.rnd.denominator(),
        )?;
        bank.rewards += fee.checked_multiply_ratio(
            params.distribution.rewards.numerator(),
            params.distribution.rewards.denominator(),
        )?;
        bank.save(deps)?;
        Ok(Coin {
            denom: params.accepted_denom,
            amount: amount - fee,
        })
    }

    pub fn take_publish_fee(
        deps: &mut DepsMut,
        funds: Vec<Coin>,
        items: usize,
    ) -> Result<(), ContractError> {
        let mult: Uint128 = Uint128::from(items as u64);
        let mut bank = BANK.load(deps.storage)?;
        let params = Params::load(&deps.as_ref())?;
        let amount = funds
            .iter()
            .find(|c| c.denom == params.accepted_denom)
            .map(|c| c.amount)
            .unwrap_or(Uint128::zero());
        // mult should be less that 100 so we can multiply without overflow
        // and we can safely unwrap
        if amount < mult * params.publish_fee {
            return error!(
                "Not enough funds for publish fee expected {} got {}",
                mult * params.publish_fee,
                amount
            );
        }
        bank.rnd += amount.checked_multiply_ratio(
            params.distribution.rnd.numerator(),
            params.distribution.rnd.denominator(),
        )?;
        bank.rewards += amount.checked_multiply_ratio(
            params.distribution.rewards.numerator(),
            params.distribution.rewards.denominator(),
        )?;
        bank.save(deps)?;
        Ok(())
    }

    pub fn exec_distribute(
        deps: &mut DepsMut,
        _env: Env,
        _info: MessageInfo,
        _msg: DistributeMsg,
    ) -> Result<Response, ContractError> {
        let mut bank = BANK.load(deps.storage)?;
        if bank.rewards == Uint128::zero() && bank.rnd == Uint128::zero() {
            return error!("Nothing to distribute");
        }
        let params = Params::load(&deps.as_ref())?;

        let mut messages = vec![];
        let mut rewards_amount = Uint128::zero();
        let mut rnd_amount = Uint128::zero();
        if bank.rewards > Uint128::zero() {
            rewards_amount = bank.rewards;
            let rewards_msg: CosmosMsg = wasm_execute(
                params.rewards_distribution_address.to_string(),
                &FundMsg::Fund(Fund { id: params.fund_id }),
                vec![Coin {
                    denom: params.accepted_denom.clone(),
                    amount: bank.rewards,
                }],
            )?
            .into();
            messages.push(rewards_msg);
            bank.rewards = Uint128::zero();
        }
        if bank.rnd > Uint128::zero() {
            rnd_amount = bank.rnd;
            let rnd_message: CosmosMsg = CosmosMsg::Bank(BankMsg::Send {
                to_address: params.admin.to_string(),
                amount: vec![Coin {
                    denom: params.accepted_denom,
                    amount: bank.rnd,
                }],
            })
            .into();
            messages.push(rnd_message);
            bank.rnd = Uint128::zero();
        }
        bank.save(deps)?;

        Ok(Response::new().add_messages(messages).add_attributes(vec![
            ("action", "distribute".to_string()),
            ("rewards_amount", rewards_amount.to_string()),
            (
                "rewards_addr",
                params.rewards_distribution_address.to_string(),
            ),
            ("rnd_amount", rnd_amount.to_string()),
            ("rnd_addr", params.admin.to_string()),
        ]))
    }

    pub fn query_get(deps: &Deps, _msg: Empty) -> Result<QueryResponse, ContractError> {
        Ok(to_json_binary(&BANK.load(deps.storage)?)?)
    }
}

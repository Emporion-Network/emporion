use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    to_json_binary, Addr, Deps, DepsMut, Empty, Env, Fraction, MessageInfo, QueryResponse,
    Response, Timestamp, Uint128,
};
use cw2::{get_contract_version, set_contract_version};
use cw_asset::{Asset, AssetInfo, AssetInfoUnchecked, AssetList, AssetListUnchecked};
use cw_storage_plus::{Bound, Item, Map, SnapshotItem, SnapshotMap, Strategy};
use cw_utils::{Duration, Expiration, WEEK};
use fraction::{GenericFraction, One};

use crate::{
    error::ContractError,
    if_test,
    msg::{
        CreateOrderExecuteMsg, CreateProductExecuteMessage, InfoResponse, InstantiateMsg,
        ReviewProductExecuteMsg, ReviewUserExecuteMsg, TotalPowerAtHeightResponse,
        VotingPowerAtHeightResponse,
    },
};

pub(crate) const CONTRACT_NAME: &str = "crates.io:emporion-core";
pub(crate) const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
pub const MAX_ITEMS_PER_PAGE: usize = if_test!(2, 10);
pub const MAX_MESSAGE_LEN: usize = 3000; // bytes

///////////////////////////////////////////////////////////////////
//////////////////////////      Stores     ////////////////////////
///////////////////////////////////////////////////////////////////

pub const CONTRACT_PARAMS: Item<ContractParams> = Item::new("prms");
pub const INDEX: Item<u64> = Item::new("idx");
pub const BANK: Item<Bank> = Item::new("bnk");
pub const BLACKLIST: Map<Addr, Empty> = Map::new("blst");
pub const USERS: Map<Addr, User> = Map::new("usr");
pub const ORDERS: Map<u64, Order> = Map::new("ord");
pub const PRODUCTS: Map<u64, Product> = Map::new("prd");
pub const REVIEWS: Map<u64, Review> = Map::new("rvw");
pub const NEXT_DISTRIBUTION: Item<Expiration> = Item::new("nxt_dist");

pub const SELLER_TO_ORDER: Map<(Addr, u64), Empty> = Map::new("slr_ord");
pub const BUYER_TO_ORDER: Map<(Addr, u64), Empty> = Map::new("byr_ord");

pub const USER_TO_REVIEW: Map<(Addr, u64), u64> = Map::new("usr_rvw");
pub const PRODUCT_TO_REVIEW: Map<(u64, u64), u64> = Map::new("prd_rvw");
pub const REVIEWER_TO_REVIEW: Map<(Addr, u64), Empty> = Map::new("rvwr_rvw");
pub const SELLER_TO_PRODUCT: Map<(Addr, u64), Empty> = Map::new("slr_prd");

pub const VOTING_POWER: SnapshotMap<Addr, Uint128> =
    SnapshotMap::new("vpr", "vpr_chpts", "vpr_chlg", Strategy::EveryBlock);
pub const TOTAL_POWER: SnapshotItem<Uint128> =
    SnapshotItem::new("tvpr", "tvpr_chpts", "tvpr_chlg", Strategy::EveryBlock);

///////////////////////////////////////////////////////////////////
//////////////////////////    Structures   ////////////////////////
///////////////////////////////////////////////////////////////////

///////////////////////
///  Distribution   ///
///////////////////////

#[cw_serde]
pub struct Distribution {
    pub to_dev: (u64, u64),
    pub to_investors: (u64, u64),
    pub to_claim_reserve: (u64, u64),
}

pub struct DistributionAssets {
    pub to_dev: AssetList,
    pub to_investors: AssetList,
    pub to_claim_reserve: AssetList,
}

///////////////////////
/// ContractParams  ///
///////////////////////

#[cw_serde]
pub struct ContractParams {
    pub admin: Addr,
    pub dev: Addr,
    pub fee_distribution: Distribution,
    pub investment_distribution: Distribution,
    pub fee: (u64, u64),
    pub publication_fee: AssetList,
    pub publication_fee_distribution: Distribution,
    pub weighted_accepted_assets: Vec<(AssetInfo, u64)>,
    pub unbounding_duration: Duration,
    pub reward_rate: Duration,
    // this is the max ratio of the users fee the contract is
    // willing to give in case of a dispute
    pub max_contract_risk_share: (u64, u64),
}

///////////////////////
///      User       ///
///////////////////////

#[cw_serde]
pub struct User {
    pub addr: Addr,
    pub nb_orders: u64,
    pub nb_rejected_orders: u64,
    pub nb_disputed_orders: u64,
    pub nb_fulfilled_orders: u64,
    pub generated_fees: AssetList,
    pub invested: AssetList,
    pub unbonding: Vec<(Asset, Expiration)>,
    // rating / Total ratings
    pub rating: (u64, u64),
}

///////////////////////
///      Order      ///
///////////////////////

#[cw_serde]
pub enum OrderStatus {
    Creating,
    Pending,
    Accepted,
    Rejected,
    Fulfilled,
    Disputed,
}

pub struct CreateOrder {
    pub buyer: Addr,
    pub seller: Addr,
    pub cart: Vec<(u64, AssetInfoUnchecked)>,
    pub buyer_risk_share: (u64, u64),
    pub status: OrderStatus,
}

#[cw_serde]
pub struct Order {
    pub id: u64,
    pub buyer: Addr,
    pub seller: Addr,
    pub total: AssetList,
    pub cart: Vec<(u64, Asset)>,
    pub status: OrderStatus,
    pub buyer_risk_share: (u64, u64),
    pub expected_delivery: Expiration,
    pub created_at: Timestamp,
}

///////////////////////
///     Product     ///
///////////////////////

#[cw_serde]
pub struct Product {
    pub id: u64,
    pub seller: Addr,
    pub price: AssetList,
    pub rating: (u64, u64),
    pub meta: String,
    pub is_listed: bool,
    pub delivery_time: Duration,
    pub meta_hash: String,
}

///////////////////////
///     Review      ///
///////////////////////

#[cw_serde]
pub enum ReviewOf {
    User(Addr),
    Product(u64),
}

#[cw_serde]
pub struct Review {
    pub id: u64,
    pub rating: u8,
    pub message: String,
    pub of: ReviewOf,
    pub from: Addr,
}

///////////////////////
///      Bank       ///
///////////////////////

#[cw_serde]
pub struct Bank {
    pub to_dev: AssetList,
    pub to_investors: AssetList,
    pub to_claim_reserve: AssetList,
    pub total_invested: AssetList,
}

///////////////////////
///    Blacklist    ///
///////////////////////

pub struct Blacklist {}

///////////////////////
///   VotingPower   ///
///////////////////////

pub struct VotingPower {}

///////////////////////////////////////////////////////////////////
////////////////////////// Implementations ////////////////////////
///////////////////////////////////////////////////////////////////

pub fn get_index(deps: &mut DepsMut) -> Result<u64, ContractError> {
    Ok(INDEX.update(deps.storage, |v| Ok::<_, ContractError>(v + 1))?)
}

///////////////////////
/// ContractParams  ///
///////////////////////

impl ContractParams {
    pub fn load(deps: Deps) -> Result<ContractParams, ContractError> {
        Ok(CONTRACT_PARAMS.load(deps.storage)?)
    }

    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        Ok(CONTRACT_PARAMS.save(deps.storage, &self)?)
    }

    pub fn loaded_get_asset_wheight(&self, asset_info: &AssetInfo) -> u64 {
        self.weighted_accepted_assets
            .iter()
            .find_map(|(info, wheight)| {
                if *info == *asset_info {
                    return Some(*wheight);
                }
                None
            })
            .unwrap_or(0)
    }

    pub fn loaded_is_admin(&self, addr: &Addr) -> Result<(), ContractError> {
        if self.admin == addr {
            return Ok(());
        }
        Err(ContractError::Unauthorized {})
    }

    pub fn loaded_is_dev(&self, addr: &Addr) -> Result<(), ContractError> {
        if self.dev == addr {
            return Ok(());
        }
        Err(ContractError::Unauthorized {})
    }

    pub fn is_admin(deps: Deps, addr: &Addr) -> Result<(), ContractError> {
        let params = ContractParams::load(deps)?;
        params.loaded_is_admin(addr)
    }

    pub fn is_dev(deps: Deps, addr: &Addr) -> Result<(), ContractError> {
        let params = ContractParams::load(deps)?;
        params.loaded_is_dev(addr)?;
        Ok(())
    }

    pub fn check_assets(deps: Deps, list: &AssetList) -> Result<(), ContractError> {
        let params = ContractParams::load(deps)?;
        params.loaded_check_assets(list)
    }

    pub fn loaded_check_assets(&self, list: &AssetList) -> Result<(), ContractError> {
        let found = list.to_vec().into_iter().find(|e| {
            self.weighted_accepted_assets
                .iter()
                .all(|(b, _)| e.info != *b)
        });
        match found {
            Some(asset) => Err(ContractError::InvalidAsset { asset }),
            None => Ok(()),
        }
    }

    pub fn check(deps: Deps, msg: InstantiateMsg) -> Result<ContractParams, ContractError> {
        let admin = deps.api.addr_validate(&msg.admin)?;
        let dev = deps.api.addr_validate(&msg.dev)?;
        msg.fee_distribution.check()?;
        msg.investment_distribution.check()?;
        msg.publication_fee_distribution.check()?;
        if msg.fee_ratio.numerator() > msg.fee_ratio.denominator()
            || msg.fee_ratio.denominator() == 0
        {
            return Err(ContractError::InvalidFee {});
        }
        if msg.max_contract_risk_share.denominator() == 0 {
            return Err(ContractError::InvalidRiskShare {
                numerator: msg.max_contract_risk_share.numerator(),
                denominator: msg.max_contract_risk_share.denominator(),
            });
        }
        let weighted_accepted_assets = msg
            .weighted_accepted_assets
            .iter()
            .map(|(info, wheight)| Ok((info.check(deps.api, None)?, *wheight)))
            .collect::<Result<Vec<_>, ContractError>>()?;
        let mut check_dups = weighted_accepted_assets
            .iter()
            .map(|a| a.0.clone())
            .collect::<Vec<_>>();
        check_dups.sort();
        check_dups.dedup();

        if check_dups.len() != weighted_accepted_assets.len() {
            return Err(ContractError::InvalidAcceptedAssets {});
        }

        Ok(ContractParams {
            admin,
            dev,
            weighted_accepted_assets,
            fee: msg.fee_ratio,
            publication_fee: msg.publication_fee.check(deps.api, None)?,
            publication_fee_distribution: msg.publication_fee_distribution,
            fee_distribution: msg.fee_distribution,
            investment_distribution: msg.investment_distribution,
            unbounding_duration: msg.unbounding_duration,
            reward_rate: msg.reward_rate,
            max_contract_risk_share: msg.max_contract_risk_share,
        })
    }

    pub fn msg_instantiate(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: InstantiateMsg,
    ) -> Result<Response, ContractError> {
        set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

        let params = ContractParams::check(deps.as_ref(), msg)?;
        CONTRACT_PARAMS.save(deps.storage, &params)?;
        Bank::init(deps)?;
        INDEX.save(deps.storage, &0)?;

        let next_dist = params.reward_rate.after(&env.block);
        NEXT_DISTRIBUTION.save(deps.storage, &next_dist)?;

        Ok(Response::new()
            .add_attribute("action", "instantiate")
            .add_attribute("sender", info.sender))
    }

    pub fn msg_update(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        msg: InstantiateMsg,
    ) -> Result<Response, ContractError> {
        ContractParams::is_admin(deps.as_ref(), &info.sender)?;
        let params = ContractParams::check(deps.as_ref(), msg)?;
        CONTRACT_PARAMS.save(deps.storage, &params)?;
        Ok(Response::new()
            .add_attribute("action", "update_params")
            .add_attribute("sender", info.sender))
    }

    pub fn msg_update_admin(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        new_admin: String,
    ) -> Result<Response, ContractError> {
        let mut params = ContractParams::load(deps.as_ref())?;
        let new_admin = deps.api.addr_validate(&new_admin)?;
        params.loaded_is_admin(&info.sender)?;
        params.admin = new_admin.clone();
        params.save(deps)?;
        Ok(Response::new()
            .add_attribute("action", "update_admin")
            .add_attribute("sender", info.sender)
            .add_attribute("new_admin", new_admin))
    }

    pub fn msg_query_info(deps: Deps) -> Result<QueryResponse, ContractError> {
        let info = get_contract_version(deps.storage)?;

        Ok(to_json_binary(&InfoResponse { info })?)
    }

    pub fn msg_query_params(deps: Deps) -> Result<QueryResponse, ContractError> {
        Ok(to_json_binary(&CONTRACT_PARAMS.load(deps.storage)?)?)
    }
}

///////////////////////
///  Distribution   ///
///////////////////////

impl Distribution {
    pub fn check(&self) -> Result<(), ContractError> {
        if GenericFraction::<u128>::new(
            self.to_claim_reserve.numerator(),
            self.to_claim_reserve.denominator(),
        ) + GenericFraction::<u128>::new(self.to_dev.numerator(), self.to_dev.denominator())
            + GenericFraction::<u128>::new(
                self.to_investors.numerator(),
                self.to_investors.denominator(),
            )
            == GenericFraction::<u128>::one()
        {
            return Ok(());
        }
        Err(ContractError::InvalidDistribution {})
    }

    pub fn apply_to(&self, assets: &AssetList) -> Result<DistributionAssets, ContractError> {
        let mut to_dev = assets.clone();
        to_dev.apply(|a| {
            a.amount = a
                .amount
                .multiply_ratio(self.to_dev.numerator(), self.to_dev.denominator())
        });
        let mut to_investors = assets.clone();
        to_investors.apply(|a| {
            a.amount = a.amount.multiply_ratio(
                self.to_investors.numerator(),
                self.to_investors.denominator(),
            )
        });
        let mut to_claim_reserve = assets.clone();
        to_claim_reserve.apply(|a| {
            a.amount = a.amount.multiply_ratio(
                self.to_claim_reserve.numerator(),
                self.to_claim_reserve.denominator(),
            )
        });

        Ok(DistributionAssets {
            to_dev,
            to_investors,
            to_claim_reserve,
        })
    }
}

///////////////////////
///    Blacklist    ///
///////////////////////

impl Blacklist {
    pub fn check(deps: Deps, addr: &Addr) -> Result<(), ContractError> {
        if BLACKLIST.has(deps.storage, addr.clone()) {
            return Err(ContractError::AddressIsBlacklisted { addr: addr.clone() });
        }
        Ok(())
    }

    pub fn msg_query_all(
        deps: Deps,
        start_from: Option<String>,
    ) -> Result<QueryResponse, ContractError> {
        let start_from = start_from
            .and_then(|s| deps.api.addr_validate(&s).ok())
            .map(|a| Bound::inclusive(a));

        let mut res = BLACKLIST
            .keys(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?;
        let start_from = if res.len() > MAX_ITEMS_PER_PAGE {
            res.pop()
        } else {
            None
        };
        Ok(to_json_binary(&(res, start_from))?)
    }


    pub fn msg_query_check(
        deps: Deps,
        addrs:Vec<String>,
    ) -> Result<QueryResponse, ContractError>{
        let res = addrs.iter().filter_map(|a|{
            deps.api.addr_validate(a).ok()
        }).filter(|a| {
            BLACKLIST.has(deps.storage, a.clone())
        }).collect::<Vec<_>>();
        Ok(to_json_binary(&res)?)
    }

    pub fn msg_blacklist(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        addrs: Vec<String>,
    ) -> Result<Response, ContractError> {
        ContractParams::is_admin(deps.as_ref(), &info.sender)?;

        let len = addrs.len().to_string();
        addrs.into_iter().try_for_each(|addr| {
            let addr = deps.api.addr_validate(&addr)?;
            BLACKLIST.save(deps.storage, addr, &Empty {})?;
            Ok::<(), ContractError>(())
        })?;

        Ok(Response::new()
            .add_attribute("action", "blacklist")
            .add_attribute("sender", info.sender)
            .add_attribute("blacklisted", len))
    }

    pub fn msg_unblacklist(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        addrs: Vec<String>,
    ) -> Result<Response, ContractError> {
        ContractParams::is_admin(deps.as_ref(), &info.sender)?;

        let len = addrs.len().to_string();
        addrs.into_iter().try_for_each(|addr| {
            let addr = deps.api.addr_validate(&addr)?;
            BLACKLIST.remove(deps.storage, addr);
            Ok::<(), ContractError>(())
        })?;
        Ok(Response::new()
            .add_attribute("action", "unblacklisted")
            .add_attribute("sender", info.sender)
            .add_attribute("unblacklisted", len))
    }
}

///////////////////////
///   VotingPower   ///
///////////////////////

impl VotingPower {
    pub fn update_power_for<F>(
        deps: &mut DepsMut,
        env: &Env,
        addr: Addr,
        update: F,
    ) -> Result<Uint128, ContractError>
    where
        F: Fn(Uint128) -> Result<Uint128, ContractError>,
    {
        let prev = VOTING_POWER
            .load(deps.storage, addr.clone())
            .unwrap_or(Uint128::zero());
        let v = update(prev)?;
        VOTING_POWER.save(deps.storage, addr, &v, env.block.height)?;
        Ok(v)
    }

    pub fn update_total_power<F>(
        deps: &mut DepsMut,
        env: &Env,
        update: F,
    ) -> Result<Uint128, ContractError>
    where
        F: Fn(Uint128) -> Result<Uint128, ContractError>,
    {
        let prev = TOTAL_POWER.load(deps.storage).unwrap_or(Uint128::zero());
        let v = update(prev)?;
        TOTAL_POWER.save(deps.storage, &v, env.block.height)?;
        Ok(v)
    }

    pub fn msg_query_at_height(
        deps: Deps,
        env: Env,
        addr: String,
        height: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let height = height.unwrap_or(env.block.height);
        let addr = deps.api.addr_validate(&addr)?;
        if let Err(_) = Blacklist::check(deps, &addr) {
            return Ok(to_json_binary(&VotingPowerAtHeightResponse {
                power: Uint128::zero(),
                height,
            })?);
        }
        let power = VOTING_POWER
            .may_load_at_height(deps.storage, addr, height)?
            .unwrap_or_default();

        Ok(to_json_binary(&VotingPowerAtHeightResponse {
            power,
            height,
        })?)
    }

    pub fn msg_query_total_at_height(
        deps: Deps,
        env: Env,
        height: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let height = height.unwrap_or(env.block.height);
        let power = TOTAL_POWER
            .may_load_at_height(deps.storage, height)?
            .unwrap_or_default();

        Ok(to_json_binary(&TotalPowerAtHeightResponse {
            height,
            power,
        })?)
    }
}

///////////////////////
///       Bank      ///
///////////////////////

impl Bank {
    pub fn init(deps: &mut DepsMut) -> Result<Bank, ContractError> {
        let bnk = Bank {
            to_dev: AssetList::new(),
            to_investors: AssetList::new(),
            to_claim_reserve: AssetList::new(),
            total_invested: AssetList::new(),
        };
        BANK.save(deps.storage, &bnk)?;
        Ok(bnk)
    }
    pub fn load(deps: Deps) -> Result<Bank, ContractError> {
        Ok(BANK.load(deps.storage)?)
    }
    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        Ok(BANK.save(deps.storage, &self)?)
    }

    pub fn msg_query(deps: Deps) -> Result<QueryResponse, ContractError> {
        let bnk = Bank::load(deps)?;
        Ok(to_json_binary(&bnk)?)
    }

    pub fn msg_withdraw_dev_to(
        deps: &mut DepsMut,
        info: MessageInfo,
        amount: AssetListUnchecked,
        to: String,
    ) -> Result<Response, ContractError> {
        ContractParams::is_dev(deps.as_ref(), &info.sender)?;
        let to = deps.api.addr_validate(&to)?;
        let mut bnk = Bank::load(deps.as_ref())?;
        let amount = amount.check(deps.api, None)?;
        bnk.to_dev.deduct_many(&amount)?;
        bnk.save(deps)?;
        let msgs = amount.transfer_msgs(to.clone())?;

        Ok(Response::new()
            .add_attribute("action", "withdraw_dev")
            .add_attribute("sender", info.sender)
            .add_attribute("sent_to", to.to_string())
            .add_messages(msgs))
    }

    pub fn msg_distribute_rewards(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
    ) -> Result<Response, ContractError> {
        let prms = ContractParams::load(deps.as_ref())?;
        prms.loaded_is_admin(&info.sender)?;
        let next_distribution = NEXT_DISTRIBUTION.load(deps.storage)?;
        if !next_distribution.is_expired(&env.block) {
            return Err(ContractError::Unauthorized {});
        }
        let mut bnk = Bank::load(deps.as_ref())?;
        let available_at = Expiration::AtHeight(env.block.height + 1);
        let mut total_dist = AssetList::new();
        USERS
            .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .map(|(_, u)| u)
            .try_for_each(|mut usr| {
                bnk.to_investors
                    .to_vec()
                    .iter()
                    .try_for_each(|to_distribute| {
                        let default_v = Asset::new(to_distribute.info.clone(), 0u128);
                        let invested = usr
                            .invested
                            .find(&to_distribute.info)
                            .unwrap_or(&default_v)
                            .amount;
                        let all_invested = bnk
                            .total_invested
                            .find(&to_distribute.info)
                            .unwrap_or(&default_v)
                            .amount;
                        if all_invested > Uint128::zero() {
                            let part = to_distribute.amount.multiply_ratio(invested, all_invested);
                            if part > Uint128::zero() {
                                let part_asset = Asset::new(to_distribute.info.clone(), part);
                                total_dist.add(&part_asset)?;
                                usr.unbonding.push((part_asset, available_at))
                            }
                        }
                        Ok::<_, ContractError>(())
                    })?;
                usr.save(deps)?;
                Ok::<_, ContractError>(())
            })?;
        let next_distribution = prms.reward_rate.after(&env.block);
        bnk.to_investors.deduct_many(&total_dist)?;
        bnk.save(deps)?;
        NEXT_DISTRIBUTION.save(deps.storage, &next_distribution)?;
        Ok(Response::new())
    }
}

///////////////////////
///       User      ///
///////////////////////

impl User {
    pub fn invest(
        deps: &mut DepsMut,
        env: Env,
        to_invest: AssetList,
        addr: Addr,
    ) -> Result<(), ContractError> {
        // 1 track the amount invested
        // 2 update powers
        // 3 split amounts for the bank
        let prms = ContractParams::load(deps.as_ref())?;
        let mut usr = User::load_or_new(deps, addr)?;
        let mut bnk = Bank::load(deps.as_ref())?;
        prms.loaded_check_assets(&to_invest)?;
        usr.invested.add_many(&to_invest)?;
        bnk.total_invested.add_many(&to_invest)?;

        let new_power = to_invest
            .to_vec()
            .into_iter()
            .fold(Uint128::zero(), |acc, c| {
                let w = prms.loaded_get_asset_wheight(&c.info);
                acc + c.amount * Uint128::from(w)
            });
        VotingPower::update_power_for(deps, &env, usr.addr.clone(), |prev_power| {
            Ok(prev_power + new_power)
        })?;

        VotingPower::update_total_power(deps, &env, |prev_total| Ok(prev_total + new_power))?;

        let DistributionAssets {
            to_dev,
            to_investors,
            to_claim_reserve,
        } = prms.investment_distribution.apply_to(&to_invest)?;

        bnk.to_dev.add_many(&to_dev)?;
        bnk.to_investors.add_many(&to_investors)?;
        bnk.to_claim_reserve.add_many(&to_claim_reserve)?;

        usr.save(deps)?;
        bnk.save(deps)?;
        Ok(())
    }

    pub fn msg_divest(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        to_divest: AssetListUnchecked,
    ) -> Result<Response, ContractError> {
        // Do not check assets as if an asset has been removed from the accepted tokens it shold still
        // be possible to withdraw
        let addr = info.sender;
        let prms = ContractParams::load(deps.as_ref())?;
        let mut u = User::load_or_new(deps, addr)?;
        let mut bnk = Bank::load(deps.as_ref())?;
        let to_divest = to_divest.check(deps.api, None)?;
        // remove from the invested list
        // calculate owned fraction from claim_reserve
        // remove from claim_reserve and total_invested
        // update voting power
        // add to unbonding

        let avalilable_at = prms.unbounding_duration.after(&env.block);
        to_divest.to_vec().into_iter().try_for_each(|a| {
            let total_invested =
                bnk.total_invested
                    .find(&a.info)
                    .ok_or(ContractError::AssetNotFound {
                        asset: a.info.clone(),
                    })?;
            let available =
                bnk.to_claim_reserve
                    .find(&a.info)
                    .ok_or(ContractError::AssetNotFound {
                        asset: a.info.clone(),
                    })?;
            let to_withdraw = available
                .amount
                .multiply_ratio(a.amount, total_invested.amount);
            let asset = Asset::new(a.info, to_withdraw);
            bnk.to_claim_reserve.deduct(&asset)?;
            u.unbonding.push((asset.clone(), avalilable_at));
            Ok::<_, ContractError>(())
        })?;
        u.invested.deduct_many(&to_divest)?;
        bnk.total_invested.deduct_many(&to_divest)?;
        let new_power = to_divest
            .to_vec()
            .into_iter()
            .fold(Uint128::zero(), |acc, c| {
                let w = prms.loaded_get_asset_wheight(&c.info);
                acc + c.amount * Uint128::from(w)
            });
        VotingPower::update_power_for(deps, &env, u.addr.clone(), |p| Ok(p - new_power))?;

        VotingPower::update_total_power(deps, &env, |p| Ok(p - new_power))?;

        u.save(deps)?;
        bnk.save(deps)?;

        Ok(Response::new()
            .add_attribute("action", "divested")
            .add_attribute("sender", u.addr.clone())
            .add_attribute("divested", to_divest.to_string()))
    }

    pub fn msg_withdraw(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
    ) -> Result<Response, ContractError> {
        let mut u = User::load(deps.as_ref(), info.sender)?;
        let withdrawable = AssetList::from(
            u.unbonding
                .iter()
                .filter_map(|(a, e)| {
                    if e.is_expired(&env.block) {
                        return Some(a.clone());
                    }
                    None
                })
                .collect::<Vec<_>>(),
        );
        u.unbonding = u
            .unbonding
            .into_iter()
            .filter(|(_, e)| !e.is_expired(&env.block))
            .collect::<Vec<_>>();
        let msgs = withdrawable.transfer_msgs(u.addr.clone())?;
        u.save(deps)?;

        Ok(Response::new()
            .add_attribute("action", "withdrew")
            .add_attribute("sender", u.addr.clone())
            .add_messages(msgs))
    }

    pub fn msg_invest(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
    ) -> Result<Response, ContractError> {
        let to_invest = AssetList::from(info.funds);
        User::invest(deps, env, to_invest.clone(), info.sender.clone())?;
        Ok(Response::new()
            .add_attribute("action", "invested")
            .add_attribute("sender", info.sender)
            .add_attribute("amount", to_invest.to_string()))
    }

    pub fn msg_cw20_invest(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        sender: String,
        amount: Uint128,
    ) -> Result<Response, ContractError> {
        let sender = deps.api.addr_validate(&sender)?;
        let mut to_invest = AssetList::new();
        to_invest.add(&Asset::cw20(info.sender, amount))?;
        User::invest(deps, env, to_invest.clone(), sender.clone())?;
        Ok(Response::new()
            .add_attribute("action", "invested")
            .add_attribute("sender", sender)
            .add_attribute("amount", to_invest.to_string()))
    }

    pub fn msg_query_stats(deps: Deps, addr: String) -> Result<QueryResponse, ContractError> {
        let addr = deps.api.addr_validate(&addr)?;
        Ok(to_json_binary(&User::load(deps, addr)?)?)
    }

    pub fn load_or_new(deps: &mut DepsMut, addr: Addr) -> Result<User, ContractError> {
        let u = User::load(deps.as_ref(), addr.clone())
            .map(|u| Ok(u))
            .unwrap_or_else(|_| {
                let u = User {
                    addr,
                    nb_orders: 0,
                    nb_rejected_orders: 0,
                    nb_disputed_orders: 0,
                    nb_fulfilled_orders: 0,
                    generated_fees: AssetList::new(),
                    invested: AssetList::new(),
                    unbonding: vec![],
                    rating: (0, 0),
                };
                u.save(deps)?;
                Ok::<_, ContractError>(u)
            })?;
        Ok(u)
    }

    pub fn load(deps: Deps, addr: Addr) -> Result<User, ContractError> {
        Ok(USERS
            .load(deps.storage, addr.clone())
            .map_err(|_| ContractError::UserNotFound { addr: addr.clone() })?)
    }
    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        USERS.save(deps.storage, self.addr.clone(), &self)?;
        Ok(())
    }
}

///////////////////////
///     Product     ///
///////////////////////

impl Product {
    pub fn load(deps: Deps, id: u64) -> Result<Product, ContractError> {
        Ok(PRODUCTS
            .load(deps.storage, id)
            .map_err(|_| ContractError::ProductNotFound { id })?)
    }
    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        Ok(PRODUCTS.save(deps.storage, self.id, &self)?)
    }

    pub fn msg_query_by_id(deps: Deps, id: u64) -> Result<QueryResponse, ContractError> {
        Ok(to_json_binary(&Product::load(deps, id)?)?)
    }

    pub fn create(
        deps: &mut DepsMut,
        msg: CreateProductExecuteMessage,
        seller: Addr,
        sent_publication_fee: AssetList,
    ) -> Result<Product, ContractError> {
        let prms = ContractParams::load(deps.as_ref())?;
        Blacklist::check(deps.as_ref(), &seller)?;
        let price = msg.price.check(deps.api, None)?;
        prms.loaded_check_assets(&price)?;
        prms.loaded_check_assets(&sent_publication_fee)?;
        if let Duration::Height(_) = msg.delivery_time {
            return Err(ContractError::InvalidDuration {});
        }
        if price.is_empty() {
            return Err(ContractError::InvalidPrice {});
        }

        if !prms.publication_fee.is_empty() {
            let mut bnk = Bank::load(deps.as_ref())?;
            sent_publication_fee
                .to_vec()
                .iter()
                .find(|sent| {
                    prms.publication_fee
                        .find(&sent.info)
                        .map(|required| sent.amount >= required.amount)
                        .unwrap_or(false)
                })
                .ok_or(ContractError::InvalidFee {})?;
            let DistributionAssets {
                to_dev,
                to_investors,
                to_claim_reserve,
            } = prms
                .publication_fee_distribution
                .apply_to(&sent_publication_fee)?;
            bnk.to_dev.add_many(&to_dev)?;
            bnk.to_claim_reserve.add_many(&to_claim_reserve)?;
            bnk.to_investors.add_many(&to_investors)?;
            bnk.save(deps)?;
        }

        if msg.meta_hash.len() != 64 || msg.meta_hash.chars().any(|c| !c.is_ascii_hexdigit()) {
            return Err(ContractError::InvalidMetaHash {});
        }

        let prd = Product {
            id: get_index(deps)?,
            meta: msg.meta,
            price,
            seller,
            is_listed: msg.is_listed,
            rating: (0, 0),
            delivery_time: msg.delivery_time,
            meta_hash: msg.meta_hash,
        };
        prd.save(deps)?;
        User::load_or_new(deps, prd.seller.clone())?;
        SELLER_TO_PRODUCT.save(deps.storage, (prd.seller.clone(), prd.id), &Empty {})?;
        Ok(prd)
    }

    pub fn msg_create(
        deps: &mut DepsMut,
        info: MessageInfo,
        msg: CreateProductExecuteMessage,
    ) -> Result<Response, ContractError> {
        let publication_fee = AssetList::from(info.funds);
        let prt = Product::create(deps, msg, info.sender, publication_fee)?;
        Ok(Response::new()
            .add_attribute("action", "product_created")
            .add_attribute("sender", prt.seller)
            .add_attribute("product_id", prt.id.to_string()))
    }

    pub fn msg_cw20_create(
        deps: &mut DepsMut,
        info: MessageInfo,
        msg: CreateProductExecuteMessage,
        sender: String,
        amount: Uint128,
    ) -> Result<Response, ContractError> {
        let sender = deps.api.addr_validate(&sender)?;
        let sent_publication_fee = AssetList::from(vec![Asset::cw20(info.sender, amount)]);
        let prt = Product::create(deps, msg, sender, sent_publication_fee)?;
        Ok(Response::new()
            .add_attribute("action", "product_created")
            .add_attribute("sender", prt.seller)
            .add_attribute("product_id", prt.id.to_string()))
    }

    pub fn msg_list(
        deps: &mut DepsMut,
        info: MessageInfo,
        product_id: u64,
    ) -> Result<Response, ContractError> {
        Blacklist::check(deps.as_ref(), &info.sender)?;
        let mut prd = Product::load(deps.as_ref(), product_id)?;
        if prd.seller != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        prd.is_listed = true;
        prd.save(deps)?;
        Ok(Response::new()
            .add_attribute("action", "product_listed")
            .add_attribute("sender", prd.seller)
            .add_attribute("product_id", prd.id.to_string()))
    }

    pub fn msg_unlist(
        deps: &mut DepsMut,
        info: MessageInfo,
        product_id: u64,
    ) -> Result<Response, ContractError> {
        Blacklist::check(deps.as_ref(), &info.sender)?;
        let mut prd = Product::load(deps.as_ref(), product_id)?;
        if prd.seller != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        prd.is_listed = false;
        prd.save(deps)?;
        Ok(Response::new()
            .add_attribute("action", "product_unlisted")
            .add_attribute("sender", prd.seller)
            .add_attribute("product_id", prd.id.to_string()))
    }

    pub fn msg_query_all(
        deps: Deps,
        start_from: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let start_from = start_from.map(|id| Bound::inclusive(id));
        let mut ret = PRODUCTS
            .range(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .map(|(_, p)| p)
            .collect::<Vec<_>>();
        let start_from = if ret.len() > MAX_ITEMS_PER_PAGE {
            ret.pop().map(|p| p.id)
        } else {
            None
        };
        Ok(to_json_binary(&(ret, start_from))?)
    }

    pub fn msg_query_of(
        deps: Deps,
        addr: String,
        start_from: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let addr = deps.api.addr_validate(&addr)?;
        let start_from = start_from.map(|id| Bound::inclusive(id));
        let mut ret = SELLER_TO_PRODUCT
            .prefix(addr)
            .range(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .map(|(product_id, _)| Product::load(deps, product_id))
            .collect::<Result<Vec<_>, _>>()?;
        let start_from = if ret.len() > MAX_ITEMS_PER_PAGE {
            ret.pop().map(|p| p.id)
        } else {
            None
        };
        Ok(to_json_binary(&(ret, start_from))?)
    }
}

///////////////////////
///      Order      ///
///////////////////////

impl Order {
    pub fn create(
        deps: &mut DepsMut,
        env: Env,
        order: CreateOrder,
        sent_assets: AssetList,
    ) -> Result<Order, ContractError> {
        let prms = ContractParams::load(deps.as_ref())?;
        // orders can only be made with the platforms accepted tokens
        prms.loaded_check_assets(&sent_assets)?;
        Blacklist::check(deps.as_ref(), &order.buyer)?;
        Blacklist::check(deps.as_ref(), &order.seller)?;
        let mut buyer = User::load_or_new(deps, order.buyer.clone())?;
        let mut seller = User::load(deps.as_ref(), order.seller.clone())?;
        if order.status == OrderStatus::Pending {
            buyer.nb_orders += 1;
            seller.nb_orders += 1;
        }

        if order.buyer_risk_share.numerator() > order.buyer_risk_share.denominator()
            || order.buyer_risk_share.denominator() == 0
        {
            return Err(ContractError::InvalidRiskShare {
                numerator: order.buyer_risk_share.numerator(),
                denominator: order.buyer_risk_share.denominator(),
            });
        }
        let id = get_index(deps)?;
        let cart = order
            .cart
            .into_iter()
            .map(|(product_id, asset_to_use)| {
                asset_to_use
                    .check(deps.api, None)
                    .map(|asset| (product_id, asset))
            })
            .collect::<Result<Vec<_>, _>>()?;
        let (products, checked_cart, expected_delivery) =
            Order::check_cart(deps.as_ref(), &env, &seller.addr, cart, &sent_assets)?;

        let odr = Order {
            id,
            total: checked_cart,
            buyer: order.buyer,
            seller: order.seller,
            status: order.status,
            buyer_risk_share: order.buyer_risk_share,
            cart: products,
            expected_delivery,
            created_at: env.block.time,
        };
        SELLER_TO_ORDER.save(deps.storage, (odr.seller.clone(), odr.id), &Empty {})?;
        BUYER_TO_ORDER.save(deps.storage, (odr.buyer.clone(), odr.id), &Empty {})?;

        buyer.save(deps)?;
        seller.save(deps)?;
        odr.save(deps)?;
        Ok(odr)
    }

    pub fn check_cart(
        deps: Deps,
        env: &Env,
        seller: &Addr,
        cart: Vec<(u64, AssetInfo)>,
        sent_assets: &AssetList,
    ) -> Result<(Vec<(u64, Asset)>, AssetList, Expiration), ContractError> {
        if cart.len() == 0 {
            return Err(ContractError::InvalidCart {});
        }
        let mut assets = sent_assets.clone();
        let mut checked_cart = AssetList::new();
        let mut products = vec![];
        let block = &env.block;
        let mut expected_delivery = Expiration::AtTime(block.time);
        cart.iter().try_for_each(|(product_id, asset_to_use)| {
            let pdt = Product::load(deps, *product_id)?;
            if pdt.seller != seller {
                return Err(ContractError::ProductNotFound { id: *product_id });
            }
            if !pdt.is_listed {
                return Err(ContractError::ProductNotFound { id: *product_id });
            }
            if pdt.delivery_time.after(&block) > expected_delivery {
                expected_delivery = pdt.delivery_time.after(&block);
            }
            let price = pdt
                .price
                .find(&asset_to_use)
                .ok_or(ContractError::AssetNotAccepted {})?;
            assets.deduct(price)?;
            checked_cart.add(price)?;
            products.push((*product_id, price.clone()));
            Ok(())
        })?;
        expected_delivery = (expected_delivery + WEEK)?;
        Ok((products, checked_cart, expected_delivery))
    }

    pub fn update(
        deps: &mut DepsMut,
        env: Env,
        order_id: u64,
        buyer: &Addr,
        cart: Vec<(u64, AssetInfoUnchecked)>,
        sent_assets: AssetList,
    ) -> Result<Order, ContractError> {
        let mut ord = Order::load(deps.as_ref(), order_id)?;
        if ord.buyer != buyer {
            return Err(ContractError::Unauthorized {});
        }
        if ord.status != OrderStatus::Creating {
            return Err(ContractError::Unauthorized {});
        }
        let prms = ContractParams::load(deps.as_ref())?;
        // orders can only be made with the platforms accepted tokens
        prms.loaded_check_assets(&sent_assets)?;
        Blacklist::check(deps.as_ref(), &ord.buyer)?;
        Blacklist::check(deps.as_ref(), &ord.seller)?;

        let cart = cart
            .into_iter()
            .map(|(product_id, asset_to_use)| {
                asset_to_use
                    .check(deps.api, None)
                    .map(|asset| (product_id, asset))
            })
            .collect::<Result<Vec<_>, _>>()?;

        let (mut prducts, checked_assets, expected_delivery) =
            Order::check_cart(deps.as_ref(), &env, &ord.seller, cart, &sent_assets)?;

        ord.cart.append(&mut prducts);
        ord.total.add_many(&checked_assets)?;
        if ord.expected_delivery < expected_delivery {
            ord.expected_delivery = expected_delivery;
        }
        ord.save(deps)?;
        Ok(ord)
    }

    pub fn add_products(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        order_id: u64,
        cart: Vec<(u64, AssetInfoUnchecked)>,
    ) -> Result<Response, ContractError> {
        let sent_assets = AssetList::from(info.funds);
        let order = Order::update(deps, env, order_id, &info.sender, cart, sent_assets)?;
        Ok(Response::new()
            .add_attribute("action", "order_updated")
            .add_attribute("sender", info.sender)
            .add_attribute("order_id", order.id.to_string()))
    }

    pub fn msg_cw20_add_products(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        sender: String,
        order_id: u64,
        cart: Vec<(u64, AssetInfoUnchecked)>,
        amount: Uint128,
    ) -> Result<Response, ContractError> {
        let sent_assets = AssetList::from(vec![Asset::cw20(info.sender, amount)]);
        let buyer = deps.api.addr_validate(&sender)?;
        let order = Order::update(deps, env, order_id, &buyer, cart, sent_assets)?;

        Ok(Response::new()
            .add_attribute("action", "order_updated")
            .add_attribute("sender", sender)
            .add_attribute("order_id", order.id.to_string()))
    }

    pub fn msg_accept(
        deps: &mut DepsMut,
        info: MessageInfo,
        order_id: u64,
    ) -> Result<Response, ContractError> {
        let mut ordr = Order::load(deps.as_ref(), order_id)?;
        Blacklist::check(deps.as_ref(), &ordr.buyer)?;
        Blacklist::check(deps.as_ref(), &ordr.seller)?;
        if ordr.status != OrderStatus::Pending {
            return Err(ContractError::Unauthorized {});
        }
        if info.sender != ordr.seller {
            return Err(ContractError::Unauthorized {});
        }

        ordr.status = OrderStatus::Accepted;
        ordr.save(deps)?;

        Ok(Response::new()
            .add_attribute("action", "order_accepted")
            .add_attribute("sender", ordr.seller)
            .add_attribute("order_id", ordr.id.to_string()))
    }

    pub fn msg_reject(
        deps: &mut DepsMut,
        info: MessageInfo,
        order_id: u64,
    ) -> Result<Response, ContractError> {
        let mut ordr = Order::load(deps.as_ref(), order_id)?;
        if ordr.status != OrderStatus::Pending && ordr.status != OrderStatus::Creating {
            return Err(ContractError::Unauthorized {});
        }
        if info.sender != ordr.seller && info.sender != ordr.buyer {
            return Err(ContractError::Unauthorized {});
        }
        if ordr.status == OrderStatus::Creating && info.sender != ordr.buyer {
            return Err(ContractError::Unauthorized {});
        }
        let mut usr = User::load(deps.as_ref(), info.sender.clone())?;

        if ordr.status == OrderStatus::Pending {
            usr.nb_rejected_orders += 1;
        }

        ordr.status = OrderStatus::Rejected;
        ordr.save(deps)?;
        usr.save(deps)?;
        let msgs = ordr.total.transfer_msgs(ordr.buyer)?;

        Ok(Response::new()
            .add_attribute("action", "order_rejected")
            .add_attribute("sender", info.sender)
            .add_attribute("order_id", ordr.id.to_string())
            .add_messages(msgs))
    }

    pub fn msg_fulfill(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        order_id: u64,
    ) -> Result<Response, ContractError> {
        // Only buyer can set an order to Fulfilled before expiration
        // seller can set it after
        // 1. calculate the fee
        // 2. distribute fee to bank
        // 3. remove fee from the to_send amout
        // 4. update generated fees for both users
        // 5. update order status
        let mut ord = Order::load(deps.as_ref(), order_id)?;
        if info.sender != ord.buyer
            && !(ord.seller == info.sender && ord.expected_delivery.is_expired(&env.block))
        {
            return Err(ContractError::Unauthorized {});
        }
        if ord.status != OrderStatus::Accepted {
            return Err(ContractError::Unauthorized {});
        }
        let prms = ContractParams::load(deps.as_ref())?;
        let mut buyer = User::load(deps.as_ref(), ord.buyer.clone())?;
        let mut seller = User::load(deps.as_ref(), ord.seller.clone())?;

        let mut bnk = Bank::load(deps.as_ref())?;
        let mut to_send = ord.total.clone();
        let mut fee = ord.total.clone();
        fee.apply(|a| {
            a.amount = a
                .amount
                .multiply_ratio(prms.fee.numerator(), prms.fee.denominator())
        });
        to_send.deduct_many(&fee)?;
        let mut half_fee = fee.clone();
        half_fee.apply(|a| {
            a.amount = a.amount.multiply_ratio(1u128, 2u128);
        });

        let DistributionAssets {
            to_dev,
            to_investors,
            to_claim_reserve,
        } = prms.fee_distribution.apply_to(&fee)?;

        bnk.to_claim_reserve.add_many(&to_claim_reserve)?;
        bnk.to_investors.add_many(&to_investors)?;
        bnk.to_dev.add_many(&to_dev)?;
        ord.status = OrderStatus::Fulfilled;
        buyer.generated_fees.add_many(&half_fee)?;
        seller.generated_fees.add_many(&half_fee)?;
        buyer.nb_fulfilled_orders += 1;
        seller.nb_fulfilled_orders += 1;

        let msgs = to_send.transfer_msgs(ord.seller.clone())?;
        ord.save(deps)?;
        bnk.save(deps)?;
        buyer.save(deps)?;
        seller.save(deps)?;
        Ok(Response::new()
            .add_messages(msgs)
            .add_attribute("action", "order_fulfilled")
            .add_attribute("sender", info.sender)
            .add_attribute("order_id", ord.id.to_string()))
    }

    pub fn msg_dispute(
        deps: &mut DepsMut,
        info: MessageInfo,
        order_id: u64,
    ) -> Result<Response, ContractError> {
        let mut ord = Order::load(deps.as_ref(), order_id)?;
        // both seller and buyer can dispute a order
        if info.sender != ord.buyer && info.sender != ord.seller {
            return Err(ContractError::Unauthorized {});
        }
        // only Accepted orders can be disputed
        if ord.status != OrderStatus::Accepted {
            return Err(ContractError::Unauthorized {});
        }
        let prms = ContractParams::load(deps.as_ref())?;
        let mut bnk = Bank::load(deps.as_ref())?;
        let mut buyer = User::load(deps.as_ref(), ord.buyer.clone())?;
        let mut seller = User::load(deps.as_ref(), ord.seller.clone())?;

        let mut fee = ord.total.clone();
        fee.apply(|a| {
            a.amount = a
                .amount
                .multiply_ratio(prms.fee.numerator(), prms.fee.denominator());
        });
        let mut half_fee = fee.clone();
        half_fee.apply(|a| {
            a.amount = a.amount.multiply_ratio(1u128, 2u128);
        });
        let mut to_share = ord.total.clone();
        to_share.deduct_many(&fee)?;
        let buyer_share = (
            ord.buyer_risk_share.denominator() - ord.buyer_risk_share.numerator(),
            ord.buyer_risk_share.denominator(),
        );
        let seller_share = ord.buyer_risk_share;

        let mut to_seller = to_share.clone();
        to_seller.apply(|a| {
            a.amount = a
                .amount
                .multiply_ratio(seller_share.numerator(), seller_share.denominator())
        });
        let mut to_buyer = to_share.clone();
        to_buyer.apply(|a| {
            a.amount = a
                .amount
                .multiply_ratio(buyer_share.numerator(), buyer_share.denominator())
        });

        to_share.to_vec().iter().try_for_each(|asset| {
            let default_asset_amount = Asset::new(asset.info.clone(), 0u128);
            let in_bnk_asset = bnk
                .to_claim_reserve
                .find(&asset.info)
                .unwrap_or(&default_asset_amount);
            // bank should have enaugh to provide the complement
            if in_bnk_asset.amount > asset.amount {
                let to_buyer_asset = to_buyer
                    .find(&asset.info)
                    .unwrap_or(&default_asset_amount)
                    .amount;
                let to_seller_asset = to_seller
                    .find(&asset.info)
                    .unwrap_or(&default_asset_amount)
                    .amount;
                let seller_generated_fee = seller
                    .generated_fees
                    .find(&asset.info)
                    .unwrap_or(&default_asset_amount)
                    .amount;
                let buyer_generated_fee = buyer
                    .generated_fees
                    .find(&asset.info)
                    .unwrap_or(&default_asset_amount)
                    .amount;

                // !seller needs to_buyer amount to complete the full price
                let for_seller_complement = seller_generated_fee
                    .multiply_ratio(
                        prms.max_contract_risk_share.numerator(),
                        prms.max_contract_risk_share.denominator(),
                    )
                    .min(to_buyer_asset);

                let for_buyer_complement = buyer_generated_fee
                    .multiply_ratio(
                        prms.max_contract_risk_share.numerator(),
                        prms.max_contract_risk_share.denominator(),
                    )
                    .min(to_seller_asset);

                // we need to substract the complements from the generated fee
                // as the max_contract_risk_share can be > 1 the complement can be
                // greater than the generated fee, thus the substraction has to
                // set the generated fee to zero in that case

                let buyer_fee_to_deduct = for_buyer_complement.min(buyer_generated_fee);
                let seller_fee_to_deduct = for_seller_complement.min(seller_generated_fee);
                buyer
                    .generated_fees
                    .deduct(&Asset::new(asset.info.clone(), buyer_fee_to_deduct))?;
                seller
                    .generated_fees
                    .deduct(&Asset::new(asset.info.clone(), seller_fee_to_deduct))?;

                to_buyer.add(&Asset::new(asset.info.clone(), for_buyer_complement))?;
                to_seller.add(&Asset::new(asset.info.clone(), for_seller_complement))?;
                bnk.to_claim_reserve
                    .deduct(&Asset::new(asset.info.clone(), for_buyer_complement))?;
                bnk.to_claim_reserve
                    .deduct(&Asset::new(asset.info.clone(), for_seller_complement))?;
            }
            Ok::<_, ContractError>(())
        })?;

        let DistributionAssets {
            to_dev,
            to_investors,
            to_claim_reserve,
        } = prms.fee_distribution.apply_to(&fee)?;
        bnk.to_claim_reserve.add_many(&to_claim_reserve)?;
        bnk.to_investors.add_many(&to_investors)?;
        bnk.to_dev.add_many(&to_dev)?;
        buyer.generated_fees.add_many(&half_fee)?;
        seller.generated_fees.add_many(&half_fee)?;
        buyer.nb_disputed_orders += 1;
        seller.nb_disputed_orders += 1;
        ord.status = OrderStatus::Disputed;

        buyer.save(deps)?;
        seller.save(deps)?;
        ord.save(deps)?;
        bnk.save(deps)?;

        let buyer_msgs = to_buyer.transfer_msgs(buyer.addr.clone())?;
        let seller_msgs = to_seller.transfer_msgs(seller.addr.clone())?;

        Ok(Response::new()
            .add_attribute("action", "order_disputed")
            .add_attribute("sender", info.sender)
            .add_attribute("order_id", ord.id.to_string())
            .add_messages(buyer_msgs)
            .add_messages(seller_msgs))
    }

    pub fn msg_finalize(
        deps: &mut DepsMut,
        info: MessageInfo,
        order_id: u64,
    ) -> Result<Response, ContractError> {
        let mut ordr = Order::load(deps.as_ref(), order_id)?;
        if ordr.buyer != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        if ordr.status != OrderStatus::Creating {
            return Err(ContractError::Unauthorized {});
        }
        Blacklist::check(deps.as_ref(), &ordr.buyer)?;
        Blacklist::check(deps.as_ref(), &ordr.seller)?;

        let mut buyer = User::load(deps.as_ref(), ordr.buyer.clone())?;
        let mut seller = User::load(deps.as_ref(), ordr.seller.clone())?;

        buyer.nb_orders += 1;
        seller.nb_orders += 1;

        ordr.status = OrderStatus::Pending;
        ordr.save(deps)?;
        buyer.save(deps)?;
        seller.save(deps)?;
        Ok(Response::new()
            .add_attribute("action", "order_ready")
            .add_attribute("sender", info.sender)
            .add_attribute("order_id", ordr.id.to_string()))
    }

    pub fn msg_create(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: CreateOrderExecuteMsg,
    ) -> Result<Response, ContractError> {
        let sent_assets = AssetList::from(info.funds);
        let seller = deps.api.addr_validate(&msg.seller)?;
        let status = if msg.ready {
            OrderStatus::Pending
        } else {
            OrderStatus::Creating
        };
        let order = CreateOrder {
            seller,
            buyer: info.sender.clone(),
            cart: msg.cart,
            buyer_risk_share: msg.buyer_risk_share,
            status,
        };
        let order = Order::create(deps, env, order, sent_assets)?;
        Ok(Response::new()
            .add_attribute("action", "order_created")
            .add_attribute("sender", info.sender)
            .add_attribute("order_id", order.id.to_string()))
    }

    pub fn msg_cw20_create(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        sender: String,
        amount: Uint128,
        msg: CreateOrderExecuteMsg,
    ) -> Result<Response, ContractError> {
        let sent_assets = AssetList::from(vec![Asset::cw20(info.sender, amount)]);

        let seller = deps.api.addr_validate(&msg.seller)?;
        let buyer = deps.api.addr_validate(&sender)?;
        let status = if msg.ready {
            OrderStatus::Pending
        } else {
            OrderStatus::Creating
        };
        let order = CreateOrder {
            seller,
            buyer: buyer.clone(),
            cart: msg.cart,
            buyer_risk_share: msg.buyer_risk_share,
            status,
        };
        let order = Order::create(deps, env, order, sent_assets)?;
        Ok(Response::new()
            .add_attribute("action", "order_created")
            .add_attribute("sender", buyer)
            .add_attribute("order_id", order.id.to_string()))
    }

    // The orders made for a seller
    pub fn msg_query_for(
        deps: Deps,
        addr: String,
        start_from: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let addr = deps.api.addr_validate(&addr)?;
        let start_from = start_from.map(|id| Bound::inclusive(id));
        let mut res = SELLER_TO_ORDER
            .prefix(addr)
            .range(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?
            .iter()
            .map(|(e, _)| Order::load(deps, *e))
            .collect::<Result<Vec<_>, _>>()?;
        let start_from = if res.len() > MAX_ITEMS_PER_PAGE {
            res.pop().map(|o| o.id)
        } else {
            None
        };
        Ok(to_json_binary(&(res, start_from))?)
    }

    // The orders made by a buyer
    pub fn msg_query_from(
        deps: Deps,
        addr: String,
        start_from: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let addr = deps.api.addr_validate(&addr)?;
        let start_from = start_from.map(|id| Bound::inclusive(id));
        let mut res = BUYER_TO_ORDER
            .prefix(addr)
            .range(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?
            .iter()
            .map(|(e, _)| Order::load(deps, *e))
            .collect::<Result<Vec<_>, _>>()?;
        let start_from = if res.len() > MAX_ITEMS_PER_PAGE {
            res.pop().map(|o| o.id)
        } else {
            None
        };
        Ok(to_json_binary(&(res, start_from))?)
    }

    pub fn msg_query_by_id(deps: Deps, order_id: u64) -> Result<QueryResponse, ContractError> {
        let res = Order::load(deps, order_id)?;
        Ok(to_json_binary(&res)?)
    }

    pub fn load(deps: Deps, id: u64) -> Result<Order, ContractError> {
        Ok(ORDERS.load(deps.storage, id)?)
    }

    pub fn other(&self, addr: &Addr) -> Addr {
        if self.buyer == addr {
            return self.seller.clone();
        }
        self.buyer.clone()
    }

    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        Ok(ORDERS.save(deps.storage, self.id, &self)?)
    }
}

///////////////////////
///      Review     ///
///////////////////////

impl Review {
    pub fn check(&self) -> Result<(), ContractError> {
        if self.rating > 5 {
            return Err(ContractError::InvalidReview {});
        }
        if self.message.len() > MAX_MESSAGE_LEN {
            return Err(ContractError::InvalidReview {});
        }
        Ok(())
    }

    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        self.check()?;
        Ok(REVIEWS.save(deps.storage, self.id, &self)?)
    }
    pub fn load(deps: Deps, id: u64) -> Result<Review, ContractError> {
        Ok(REVIEWS
            .load(deps.storage, id)
            .map_err(|_| ContractError::ReviewNotFound { id })?)
    }

    pub fn create(
        deps: &mut DepsMut,
        rating: u8,
        message: String,
        from: Addr,
        of: ReviewOf,
    ) -> Result<Review, ContractError> {
        let id = get_index(deps)?;
        let review = Review {
            id,
            message,
            rating,
            of,
            from: from.clone(),
        };
        review.check()?;
        REVIEWS.save(deps.storage, id, &review)?;
        REVIEWER_TO_REVIEW.save(deps.storage, (from, id), &Empty {})?;
        Ok(review)
    }

    pub fn msg_review_user(
        deps: &mut DepsMut,
        info: MessageInfo,
        msg: ReviewUserExecuteMsg,
    ) -> Result<Response, ContractError> {
        let ordr = Order::load(deps.as_ref(), msg.order_id)?;
        if ordr.buyer != info.sender && ordr.seller != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        if ordr.status != OrderStatus::Fulfilled && ordr.status != OrderStatus::Disputed {
            return Err(ContractError::Unauthorized {});
        }
        let mut to_be_rated = User::load(deps.as_ref(), ordr.other(&info.sender))?;
        let user_to_review = USER_TO_REVIEW.key((to_be_rated.addr.clone(), ordr.id));
        let mut action = "user_review_created";
        let review_id = if user_to_review.has(deps.storage) {
            let review_id = user_to_review.load(deps.storage)?;
            let mut review = Review::load(deps.as_ref(), review_id)?;
            // remove previous rating
            // add new rating
            to_be_rated.rating.0 -= u64::from(review.rating);
            to_be_rated.rating.0 += u64::from(msg.rating);
            review.message = msg.message;
            review.rating = msg.rating;
            review.save(deps)?;
            action = "user_review_updated";
            review_id
        } else {
            let review = Review::create(
                deps,
                msg.rating,
                msg.message,
                info.sender.clone(),
                ReviewOf::User(to_be_rated.addr.clone()),
            )?;
            to_be_rated.rating.0 += u64::from(msg.rating);
            to_be_rated.rating.1 += 1;
            user_to_review.save(deps.storage, &review.id)?;
            review.id
        };
        to_be_rated.save(deps)?;

        Ok(Response::new()
            .add_attribute("action", action)
            .add_attribute("sender", info.sender)
            .add_attribute("review_id", review_id.to_string()))
    }

    pub fn msg_review_product(
        deps: &mut DepsMut,
        info: MessageInfo,
        msg: ReviewProductExecuteMsg,
    ) -> Result<Response, ContractError> {
        let ordr = Order::load(deps.as_ref(), msg.order_id)?;
        // 1. only buyer can review a product
        // 2. only Fulfilled and Disputed orders can be used to rate
        // 3. order should contain the product to be rated
        if ordr.buyer != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        if ordr.status != OrderStatus::Fulfilled && ordr.status != OrderStatus::Disputed {
            return Err(ContractError::Unauthorized {});
        }
        if ordr.cart.iter().all(|(id, _)| id != &msg.product_id) {
            return Err(ContractError::Unauthorized {});
        }
        let mut to_be_rated = Product::load(deps.as_ref(), msg.product_id)?;
        let product_to_review = PRODUCT_TO_REVIEW.key((to_be_rated.id, ordr.id));
        let mut action = "create_product_review";
        let review_id = if product_to_review.has(deps.storage) {
            let review_id = product_to_review.load(deps.storage)?;
            let mut review = Review::load(deps.as_ref(), review_id)?;
            // remove previous rating
            // add new rating
            to_be_rated.rating.0 -= u64::from(review.rating);
            to_be_rated.rating.0 += u64::from(msg.rating);
            review.message = msg.message;
            review.rating = msg.rating;
            review.save(deps)?;
            action = "update_product_review";
            review_id
        } else {
            let review = Review::create(
                deps,
                msg.rating,
                msg.message,
                info.sender.clone(),
                ReviewOf::Product(to_be_rated.id),
            )?;
            to_be_rated.rating.0 += u64::from(msg.rating);
            to_be_rated.rating.1 += 1;
            product_to_review.save(deps.storage, &review.id)?;
            review.id
        };
        to_be_rated.save(deps)?;

        Ok(Response::new()
            .add_attribute("action", action)
            .add_attribute("sender", info.sender)
            .add_attribute("review_id", review_id.to_string()))
    }

    pub fn msg_query_product_reviews(
        deps: Deps,
        product_id: u64,
        start_from: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let start_from = start_from.map(|s| Bound::inclusive(s));
        let mut last_order = 0;
        let mut ret = PRODUCT_TO_REVIEW
            .prefix(product_id)
            .range(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?
            .iter()
            .map(|(order_id, review_id)| {
                last_order = *order_id;
                Review::load(deps, *review_id)
            })
            .collect::<Result<Vec<_>, _>>()?;
        let start_from = if ret.len() > MAX_ITEMS_PER_PAGE {
            ret.pop();
            Some(last_order)
        } else {
            None
        };

        Ok(to_json_binary(&(ret, start_from))?)
    }

    pub fn msg_query_reviews_of_reviewed(
        deps: Deps,
        addr: String,
        start_from: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let addr = deps.api.addr_validate(&addr)?;
        let start_from = start_from.map(|s| Bound::inclusive(s));
        let mut last_order = 0;
        let mut ret = USER_TO_REVIEW
            .prefix(addr)
            .range(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?
            .iter()
            .map(|(order_id, review_id)| {
                last_order = *order_id;
                Review::load(deps, *review_id)
            })
            .collect::<Result<Vec<_>, _>>()?;
        let start_from = if ret.len() > MAX_ITEMS_PER_PAGE {
            ret.pop();
            Some(last_order)
        } else {
            None
        };

        Ok(to_json_binary(&(ret, start_from))?)
    }

    pub fn msg_query_reviews_from_reviewer(
        deps: Deps,
        addr: String,
        start_from: Option<u64>,
    ) -> Result<QueryResponse, ContractError> {
        let addr = deps.api.addr_validate(&addr)?;
        let start_from = start_from.map(|id| Bound::inclusive(id));
        let mut ret = REVIEWER_TO_REVIEW
            .prefix(addr)
            .range(
                deps.storage,
                start_from,
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(MAX_ITEMS_PER_PAGE + 1)
            .collect::<Result<Vec<_>, _>>()?
            .iter()
            .map(|(id, _)| Review::load(deps, *id))
            .collect::<Result<Vec<_>, _>>()?;
        let start_from = if ret.len() > MAX_ITEMS_PER_PAGE {
            ret.pop().map(|r| r.id)
        } else {
            None
        };
        Ok(to_json_binary(&(ret, start_from))?)
    }
}

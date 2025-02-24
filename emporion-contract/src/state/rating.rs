use std::ops::{Add, Sub};

use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    to_json_binary, Addr, Deps, DepsMut, Env, MessageInfo, QueryResponse, Response, Uint64,
};
use cw_storage_plus::{Bound, Map};

use crate::{
    error,
    error::ContractError,
    msg::{
        exec::RateUserMsg,
        query::{ByIndex, Paginated, PaginatedByAddress, PaginatedByIndex},
    },
    MAX_ITEMS_PER_PAGE, MAX_STRING_SIZE,
};

use super::{index::Index, order::Order};

const RATINGS: Map<u64, Rating> = Map::new("ratings");
////////////////////////// Usr   order  buyer rating
//////////////////////////   |     |     |      |
const ADDR_TO_RATINGS: Map<(Addr, u64), (bool, u64)> = Map::new("addr_to_ratings");
const ORDER_TO_RATINGS: Map<(u64, u64), ()> = Map::new("order_to_ratings");
const ADDR_TO_MARK: Map<Addr, Mark> = Map::new("addr_to_mark");

#[cw_serde]
struct Mark(u32, u32, u32, u32, u32, u32);

impl Mark {
    pub fn new(fst: u8) -> Result<Self, ContractError> {
        if fst > 5 {
            return error!("Mark should be in range [0,5]");
        }
        Ok(Self(0, 0, 0, 0, 0, 0) + fst)
    }

    pub fn save(&self, deps: &mut DepsMut, addr: Addr) -> Result<(), ContractError> {
        Ok(ADDR_TO_MARK.save(deps.storage, addr, &self)?)
    }
}

impl Add<u8> for Mark {
    type Output = Mark;
    fn add(mut self, rhs: u8) -> Self::Output {
        match rhs {
            0 => self.0 += 1,
            1 => self.1 += 1,
            2 => self.2 += 1,
            3 => self.3 += 1,
            4 => self.4 += 1,
            5 => self.5 += 1,
            _ => unreachable!(""),
        }
        return self;
    }
}

impl Sub<u8> for Mark {
    type Output = Mark;
    fn sub(mut self, rhs: u8) -> Self::Output {
        match rhs {
            0 => self.0 -= 1,
            1 => self.1 -= 1,
            2 => self.2 -= 1,
            3 => self.3 -= 1,
            4 => self.4 -= 1,
            5 => self.5 -= 1,
            _ => unreachable!(""),
        }
        return self;
    }
}

#[cw_serde]
pub struct Rating {
    pub id: Uint64,
    pub order_id: Uint64,
    pub rated: Addr,
    pub rater: Addr,
    pub mark: u8,
    pub comment: String,
    pub created_at: Uint64,
    pub last_updated_at: Option<Uint64>,
}

impl Rating {
    fn new(
        deps: &mut DepsMut,
        order_id: Uint64,
        rater: Addr,
        rated: Addr,
        mark: u8,
        comment: String,
        created_at: Uint64,
    ) -> Result<Self, ContractError> {
        if mark > 5 {
            return error!("Mark should be in range [0,5]");
        }
        if comment.len() > MAX_STRING_SIZE {
            return error!("Comment is too long");
        }
        let res = Self {
            id: Index::next(deps)?.into(),
            order_id,
            rater,
            rated,
            mark,
            comment,
            created_at,
            last_updated_at: None,
        };
        RATINGS.save(deps.storage, res.id.u64(), &res)?;
        Ok(res)
    }

    fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        Ok(RATINGS.save(deps.storage, self.id.u64(), &self)?)
    }
    pub fn get(deps: &Deps, id: u64) -> Result<Self, ContractError> {
        RATINGS
            .load(deps.storage, id)
            .map_err(|_| ContractError::custom(format!("Rating {} not found", id)))
    }

    pub fn query_get(deps: &Deps, msg: ByIndex) -> Result<QueryResponse, ContractError> {
        Ok(to_json_binary(&Self::get(&deps, msg.id.u64())?)?)
    }

    pub fn query_addr(
        deps: &Deps,
        addr: String,
        p: Paginated,
        tag: bool,
    ) -> Result<QueryResponse, ContractError> {
        let max = p.start_after.map(|v| Bound::exclusive(v.u64()));
        let limit = u32::min(p.limit.unwrap_or(MAX_ITEMS_PER_PAGE), MAX_ITEMS_PER_PAGE);
        let addr = deps.api.addr_validate(&addr)?;
        let res = ADDR_TO_RATINGS
            .prefix(addr)
            .range(deps.storage, None, max, cosmwasm_std::Order::Descending)
            .filter_map(|v| v.map(|(_, k)| k).ok())
            .filter_map(|(v, i)| if v == tag { Some(i) } else { None })
            .take(limit as usize)
            .map(|v| RATINGS.load(deps.storage, v))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(to_json_binary(&res)?)
    }

    pub fn query_from(
        deps: &Deps,
        msg: PaginatedByAddress,
    ) -> Result<QueryResponse, ContractError> {
        Self::query_addr(deps, msg.addr, msg.pagination, true)
    }

    pub fn query_for(deps: &Deps, msg: PaginatedByAddress) -> Result<QueryResponse, ContractError> {
        Self::query_addr(deps, msg.addr, msg.pagination, false)
    }

    pub fn query_list(deps: &Deps, p: Paginated) -> Result<QueryResponse, ContractError> {
        let max = p.start_after.map(|v| Bound::exclusive(v.u64()));
        let limit = u32::min(p.limit.unwrap_or(MAX_ITEMS_PER_PAGE), MAX_ITEMS_PER_PAGE);
        let res = RATINGS
            .range(deps.storage, None, max, cosmwasm_std::Order::Descending)
            .take(limit as usize)
            .map(|v| v.map(|(_, v)| v))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(to_json_binary(&res)?)
    }

    pub fn query_by_order(
        deps: &Deps,
        msg: PaginatedByIndex,
    ) -> Result<QueryResponse, ContractError> {
        let max: Option<Bound<'_, _>> = msg
            .pagination
            .start_after
            .map(|v| Bound::exclusive(v.u64()));
        let limit = u32::min(
            msg.pagination.limit.unwrap_or(MAX_ITEMS_PER_PAGE),
            MAX_ITEMS_PER_PAGE,
        );

        let res = ORDER_TO_RATINGS
            .prefix(msg.id.u64())
            .range(deps.storage, None, max, cosmwasm_std::Order::Descending)
            .take(limit as usize)
            .map(|v| v.map(|(k, _)| k).ok())
            .map(|v| RATINGS.load(deps.storage, v.unwrap()))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(to_json_binary(&res)?)
    }

    pub fn exec_upsert(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: RateUserMsg,
    ) -> Result<Response, ContractError> {
        let o = Order::get(&deps.as_ref(), msg.order_id.u64())?;
        let to_rate = deps.api.addr_validate(&msg.user)?;
        if to_rate != o.buyer && to_rate != o.seller {
            return Err(ContractError::Unauthorized {});
        }
        if info.sender != o.buyer && info.sender != o.seller {
            return Err(ContractError::Unauthorized {});
        }
        if msg.mark > 5 {
            return error!("Mark should be in range [0,5]");
        }
        let key = (info.sender.clone(), o.id.u64());
        let rating_id = ADDR_TO_RATINGS.may_load(deps.storage, key.clone())?;
        if let Some((_, rating_id)) = rating_id {
            // update
            let mut rating = RATINGS.load(deps.storage, rating_id)?;
            let mut mark = ADDR_TO_MARK.load(deps.storage, to_rate.clone())?;
            mark = (mark - rating.mark) + msg.mark;
            mark.save(deps, to_rate)?;

            rating.mark = msg.mark;
            rating.comment = msg.comment;
            rating.last_updated_at = Some((env.block.time.seconds() * 1000).into());
            rating.save(deps)?;

            Ok(Response::new().add_attributes(vec![
                ("action", "update_rating"),
                ("id", &rating.id.to_string()),
            ]))
        } else {
            // insert
            let tag = o.buyer == info.sender;
            let rating = Rating::new(
                deps,
                o.id,
                info.sender.clone(),
                to_rate.clone(),
                msg.mark,
                msg.comment,
                (env.block.time.seconds() * 1000).into(),
            )?;
            ADDR_TO_MARK.save(deps.storage, to_rate.clone(), &Mark::new(msg.mark)?)?;
            ADDR_TO_RATINGS.save(deps.storage, key, &(tag, rating.id.u64()))?;
            ORDER_TO_RATINGS.save(deps.storage, (o.id.u64(), rating.id.u64()), &())?;
            Ok(Response::new().add_attributes(vec![
                ("action", "update_rating"),
                ("id", &rating.id.to_string()),
            ]))
        }
    }
}

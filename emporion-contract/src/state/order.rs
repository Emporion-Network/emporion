use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    to_json_binary, Addr, BankMsg, Coin, CosmosMsg, Decimal, Deps, DepsMut, Env, Fraction,
    MessageInfo, QueryResponse, Response, Uint128, Uint64,
};
use cw_storage_plus::{Bound, Map};

use crate::{
    error,
    error::ContractError,
    msg::{
        exec::{AcceptOrderMsg, CancelOrderMsg, CompleteOrderMsg, CreateOrderMsg, DisputeOrderMsg},
        query::{ByIndex, Paginated, PaginatedByAddress},
    },
    MAX_ITEMS_PER_PAGE,
};

use super::{bnk::Bank, index::Index, params::Params, product::Product};

const ORDERS: Map<u64, Order> = Map::new("orders");
//////////////////////////   Usr   Order  B/S
//////////////////////////    |     |     |
const ADDR_TO_ORDER_ID: Map<(Addr, u64), bool> = Map::new("addr_to_order");

#[cw_serde]
pub struct Order {
    pub id: Uint64,
    pub seller: Addr,
    pub buyer: Addr,
    pub cart: Vec<Uint64>,
    pub total: Uint128,
    pub status: OrderStatus,
    pub created_at: Uint64,
    pub completed_at: Option<Uint64>,
    pub loss_distribution_ratio: Decimal,
}

#[cw_serde]
pub enum OrderStatus {
    Pending,
    Accepted,
    Cancelled,
    Completed,
    Disputed,
}

impl Order {
    pub fn new(
        deps: &mut DepsMut,
        seller: Addr,
        buyer: Addr,
        price: Uint128,
        cart: Vec<Uint64>,
        creation_time: impl Into<Uint64>,
        loss_distribution_ratio: Decimal,
    ) -> Result<Self, ContractError> {
        let id = Index::next(deps)?;
        let res = Self {
            id: id.into(),
            seller: seller.clone(),
            buyer: buyer.clone(),
            cart,
            total: price,
            status: OrderStatus::Pending,
            created_at: creation_time.into(),
            completed_at: None,
            loss_distribution_ratio,
        };
        ADDR_TO_ORDER_ID.save(deps.storage, (buyer, id), &true)?;
        ADDR_TO_ORDER_ID.save(deps.storage, (seller, id), &false)?;
        ORDERS.save(deps.storage, id, &res)?;
        Ok(res)
    }

    pub fn get(deps: &Deps, id: u64) -> Result<Self, ContractError> {
        ORDERS
            .load(deps.storage, id.into())
            .map_err(|_| ContractError::custom(format!("Order {} not found", id)))
    }

    pub fn query_get(deps: &Deps, msg: ByIndex) -> Result<QueryResponse, ContractError> {
        Ok(to_json_binary(&Self::get(deps, msg.id.u64())?)?)
    }

    pub fn query_list(deps: &Deps, msg: Paginated) -> Result<QueryResponse, ContractError> {
        let max = msg.start_after.map(|v| Bound::exclusive(v));
        let limit = u32::min(msg.limit.unwrap_or(MAX_ITEMS_PER_PAGE), MAX_ITEMS_PER_PAGE);
        let res = ORDERS
            .range(deps.storage, None, max, cosmwasm_std::Order::Descending)
            .take(limit as usize)
            .map(|o| o.map(|(_, o)| o))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(to_json_binary(&res)?)
    }

    fn query_addr(
        deps: &Deps,
        p: Paginated,
        addr: String,
        tag: bool,
    ) -> Result<Vec<Order>, ContractError> {
        let addr = deps.api.addr_validate(&addr)?;
        let max = p.start_after.map(|v| Bound::exclusive(v));
        let limit = u32::min(p.limit.unwrap_or(MAX_ITEMS_PER_PAGE), MAX_ITEMS_PER_PAGE);
        let res = ADDR_TO_ORDER_ID
            .prefix(addr)
            .range(deps.storage, None, max, cosmwasm_std::Order::Descending)
            .filter_map(|v| v.ok())
            .filter_map(|v| if v.1 == tag { Some(v.0) } else { None })
            .take(limit as usize)
            .map(|id| Self::get(deps, id))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(res)
    }

    pub fn query_for(deps: &Deps, msg: PaginatedByAddress) -> Result<QueryResponse, ContractError> {
        let res = Self::query_addr(&deps, msg.pagination, msg.addr, false)?;
        Ok(to_json_binary(&res)?)
    }

    pub fn query_from(
        deps: &Deps,
        msg: PaginatedByAddress,
    ) -> Result<QueryResponse, ContractError> {
        let res = Self::query_addr(&deps, msg.pagination, msg.addr, true)?;
        Ok(to_json_binary(&res)?)
    }

    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        ORDERS.save(deps.storage, self.id.u64(), &self)?;
        Ok(())
    }

    pub fn exec_accept(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        msg: AcceptOrderMsg,
    ) -> Result<Response, ContractError> {
        let mut order = Self::get(&deps.as_ref(), msg.order_id.u64())?;
        if order.seller != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        if order.status != OrderStatus::Pending {
            return Err(ContractError::Unauthorized {});
        }
        order.status = OrderStatus::Accepted;
        order.save(deps)?;
        Ok(Response::new().add_attributes(vec![
            ("action", "accept_order"),
            ("id", &order.id.to_string()),
            ("seller", &order.seller.to_string()),
        ]))
    }

    pub fn exec_cancel(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        msg: CancelOrderMsg,
    ) -> Result<Response, ContractError> {
        let mut order = Self::get(&deps.as_ref(), msg.order_id.u64())?;
        if info.sender != order.seller && info.sender != order.buyer {
            return Err(ContractError::Unauthorized {});
        }
        if order.status != OrderStatus::Pending {
            return Err(ContractError::Unauthorized {});
        }
        order.status = OrderStatus::Cancelled;
        order.save(deps)?;
        let params = Params::load(&deps.as_ref())?;
        let msg = CosmosMsg::Bank(BankMsg::Send {
            to_address: order.buyer.to_string(),
            amount: vec![Coin {
                amount: order.total,
                denom: params.accepted_denom,
            }],
        });
        Ok(Response::new()
            .add_attributes(vec![
                ("action", "cancel_order"),
                ("id", &order.id.to_string()),
                ("sender", &info.sender.to_string()),
            ])
            .add_message(msg))
    }

    pub fn exec_complete(
        deps: &mut DepsMut,
        _env: Env,
        info: MessageInfo,
        msg: CompleteOrderMsg,
    ) -> Result<Response, ContractError> {
        let mut order = Self::get(&deps.as_ref(), msg.order_id.u64())?;
        if order.buyer != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        if order.status != OrderStatus::Accepted {
            return Err(ContractError::Unauthorized {});
        }
        order.status = OrderStatus::Completed;
        order.save(deps)?;
        let to_send = Bank::take_platform_fee(deps, order.total)?;

        let msg = CosmosMsg::Bank(BankMsg::Send {
            to_address: order.seller.to_string(),
            amount: vec![to_send],
        });

        Ok(Response::new()
            .add_attributes(vec![
                ("action", "complete_order"),
                ("id", &order.id.to_string()),
                ("sender", &order.buyer.to_string()),
            ])
            .add_message(msg))
    }

    pub fn exec_dispute(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: DisputeOrderMsg,
    ) -> Result<Response, ContractError> {
        let mut o = Order::get(&deps.as_ref(), msg.order_id.u64())?;
        if info.sender != o.buyer && info.sender != o.seller {
            return Err(ContractError::Unauthorized {});
        }
        if o.status != OrderStatus::Accepted {
            return Err(ContractError::Unauthorized {});
        }
        o.status = OrderStatus::Disputed;
        o.completed_at = Some((env.block.time.seconds() * 1000).into());
        o.save(deps)?;
        let to_send = Bank::take_platform_fee(deps, o.total)?;
        let to_buyer = to_send.amount.checked_multiply_ratio(
            o.loss_distribution_ratio.numerator(),
            o.loss_distribution_ratio.denominator(),
        )?;
        let to_seller = to_send.amount - to_buyer;

        let msg_buyer = CosmosMsg::Bank(BankMsg::Send {
            to_address: o.buyer.to_string(),
            amount: vec![Coin {
                denom: to_send.denom.clone(),
                amount: to_buyer,
            }],
        });
        let msg_seller = CosmosMsg::Bank(BankMsg::Send {
            to_address: o.seller.to_string(),
            amount: vec![Coin {
                denom: to_send.denom,
                amount: to_seller,
            }],
        });

        Ok(Response::new().add_messages(vec![msg_buyer, msg_seller]))
    }

    pub fn exec_create(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: CreateOrderMsg,
    ) -> Result<Response, ContractError> {
        let creation_time = env.block.time.seconds() * 1000;
        let params = Params::load(&deps.as_ref())?;
        let sent = info.funds.iter().find(|c| c.denom == params.accepted_denom);
        if sent.is_none() {
            return error!("Denom {} not found", params.accepted_denom);
        }
        let mut sent = sent.unwrap().amount;

        let mut order_ids = vec![];
        for msg in msg.orders {
            if msg.loss_distribution_ratio > Decimal::one() {
                return error!(
                    "Loss distribution ratio must be between 0 and 1, found {}",
                    msg.loss_distribution_ratio
                );
            }
            let mut seller_addr = None;
            let mut total = Uint128::zero();
            for id in msg.product_ids.iter() {
                let product = Product::get(&deps.as_ref(), id.u64())?;
                if !product.listed {
                    return error!("Product not listed");
                }
                if seller_addr.is_none() {
                    seller_addr = Some(product.owner.clone())
                }
                if seller_addr.as_ref().unwrap() != product.owner {
                    return error!("Products must be owned by the same seller");
                }
                if sent < product.price {
                    return error!("Not enough funds");
                }
                sent -= product.price;
                total += product.price;
            }
            if seller_addr.is_none() {
                return error!("No products found");
            }

            let id = Order::new(
                deps,
                seller_addr.unwrap(),
                info.sender.clone(),
                total,
                msg.product_ids,
                creation_time,
                msg.loss_distribution_ratio,
            )?
            .id;
            order_ids.push(id.to_string());
        }

        Ok(Response::new().add_attributes(vec![
            ("action", "create_order"),
            ("order_ids", &order_ids.join(", ")),
        ]))
    }
}

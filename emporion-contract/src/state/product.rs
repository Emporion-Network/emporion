use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    to_json_binary, Addr, Deps, DepsMut, Env, MessageInfo, QueryResponse, Response, Uint128, Uint64,
};
use cw_storage_plus::{Bound, Map};

use crate::{
    error,
    error::ContractError,
    msg::{
        exec::{CreateBulkProductsMsg, CreateProductMsg, UpdateBulkProductMsg, UpdateProductMsg},
        query::{ByIndex, Paginated, PaginatedByAddress},
    },
    MAX_ITEMS_PER_PAGE, MAX_STRING_SIZE,
};

use super::{bnk::Bank, index::Index};

const PRODUCTS: Map<u64, Product> = Map::new("products");
const ADDR_TO_ID: Map<(Addr, u64), ()> = Map::new("addr_product");

#[cw_serde]
pub struct Product {
    pub id: Uint64,
    pub owner: Addr,
    pub price: Uint128,
    pub listed: bool,
    pub created_at: Uint64,
    pub last_updated_at: Option<Uint64>,
    pub meta_data_url: String,
}

impl Product {
    pub fn new(
        deps: &mut DepsMut,
        owner: Addr,
        price: Uint128,
        listed: bool,
        meta_data_url: String,
        created_at: Uint64,
    ) -> Result<Self, ContractError> {
        let id = Index::next(deps)?;
        let res = Self {
            id: id.into(),
            owner: owner.clone(),
            price,
            listed,
            created_at,
            last_updated_at: None,
            meta_data_url,
        };
        res.check()?;
        ADDR_TO_ID.save(deps.storage, (owner, id), &())?;
        PRODUCTS.save(deps.storage, id, &res)?;
        Ok(res)
    }

    pub fn check(&self) -> Result<(), ContractError> {
        if self.price == Uint128::zero() {
            return error!("Price can not be zero");
        }
        if self.meta_data_url.is_empty() {
            return error!("Meta data url can not be empty");
        }
        if self.meta_data_url.len() > MAX_STRING_SIZE {
            return error!("Meta data url is too long");
        }
        Ok(())
    }

    pub fn get(deps: &Deps, id: u64) -> Result<Self, ContractError> {
        PRODUCTS
            .load(deps.storage, id.into())
            .map_err(|_| ContractError::custom(format!("Product {} not found", id)))
    }

    pub fn query_get(deps: &Deps, msg: ByIndex) -> Result<QueryResponse, ContractError> {
        Ok(to_json_binary(&Self::get(deps, msg.id.into())?)?)
    }

    pub fn save(&self, deps: &mut DepsMut) -> Result<(), ContractError> {
        self.check()?;
        PRODUCTS.save(deps.storage, self.id.u64(), &self)?;
        Ok(())
    }

    pub fn query_list(deps: &Deps, p: Paginated) -> Result<QueryResponse, ContractError> {
        let min = p.start_after.map(|v| Bound::exclusive(v));
        let limit = u32::min(p.limit.unwrap_or(MAX_ITEMS_PER_PAGE), MAX_ITEMS_PER_PAGE);
        let res = PRODUCTS
            .range(deps.storage, None, min, cosmwasm_std::Order::Descending)
            .take(limit as usize)
            .map(|v| v.map(|(_, p)| p))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(to_json_binary(&res)?)
    }

    pub fn query_list_by_addr(
        deps: &Deps,
        msg: PaginatedByAddress,
    ) -> Result<QueryResponse, ContractError> {
        let addr = Addr::unchecked(msg.addr);
        let p = msg.pagination;
        let min = p.start_after.map(|v| Bound::exclusive(v));
        let limit = u32::min(p.limit.unwrap_or(MAX_ITEMS_PER_PAGE), MAX_ITEMS_PER_PAGE);
        let res = ADDR_TO_ID
            .prefix(addr)
            .range(deps.storage, min, None, cosmwasm_std::Order::Descending)
            .take(limit as usize)
            .filter_map(|v| v.map(|(k, _)| k).ok())
            .map(|v| Product::get(&deps, v))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(to_json_binary(&res)?)
    }

    pub fn exec_create(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: CreateProductMsg,
    ) -> Result<Response, ContractError> {
        Bank::take_publish_fee(deps, info.funds, 1)?;
        let product = Self::new(
            deps,
            info.sender.clone(),
            msg.price,
            msg.listed,
            msg.meta_data_url,
            (env.block.time.seconds() * 1000).into(),
        )?;

        Ok(Response::new().add_attributes(vec![
            ("action", "create_product"),
            ("id", &product.id.to_string()),
            ("owner", &product.owner.to_string()),
            ("price", &product.price.to_string()),
            ("listed", &product.listed.to_string()),
            ("meta_data_url", &product.meta_data_url.to_string()),
        ]))
    }

    pub fn exec_bulk_create(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: CreateBulkProductsMsg,
    ) -> Result<Response, ContractError> {
        if msg.products.len() > MAX_ITEMS_PER_PAGE as usize {
            return error!(
                "Too many products sent {}, max {}",
                msg.products.len(),
                MAX_ITEMS_PER_PAGE
            );
        }
        Bank::take_publish_fee(deps, info.funds, msg.products.len())?;
        let mut ids = vec![];
        for product in msg.products {
            let p = Self::new(
                deps,
                info.sender.clone(),
                product.price,
                product.listed,
                product.meta_data_url,
                (env.block.time.seconds() * 1000).into(),
            )?;
            ids.push(p.id.to_string());
        }
        Ok(Response::new().add_attributes(vec![
            ("action", "create_bulk_products"),
            ("owner", &info.sender.to_string()),
            ("product_ids", &ids.join(", ")),
        ]))
    }

    pub fn exec_update(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: UpdateProductMsg,
    ) -> Result<Response, ContractError> {
        let mut p = Product::get(&deps.as_ref(), msg.product_id.u64())?;
        let mut attr = vec![
            ("action", "update_product".to_string()),
            ("id", p.id.to_string()),
            ("owner", p.owner.to_string()),
        ];
        if p.owner != info.sender {
            return Err(ContractError::Unauthorized {});
        }
        if let Some(price) = msg.price {
            attr.push(("old_price", p.price.to_string()));
            p.price = price;
            attr.push(("price", p.price.to_string()));
        }
        if let Some(listed) = msg.listed {
            attr.push(("old_listed", p.listed.to_string()));
            p.listed = listed;
            attr.push(("listed", p.listed.to_string()));
        }
        if let Some(meta_data_url) = msg.meta_data_url {
            attr.push(("old_meta_data_url", p.meta_data_url.to_string()));
            p.meta_data_url = meta_data_url;
            attr.push(("meta_data_url", p.meta_data_url.to_string()));
        }
        p.last_updated_at = Some((env.block.time.seconds() * 1000).into());
        p.save(deps)?;
        Ok(Response::new().add_attributes(attr))
    }

    pub fn exec_bulk_update(
        deps: &mut DepsMut,
        env: Env,
        info: MessageInfo,
        msg: UpdateBulkProductMsg,
    ) -> Result<Response, ContractError> {
        if msg.products.len() > MAX_ITEMS_PER_PAGE as usize {
            return error!(
                "Too many products sent {}, max {}",
                msg.products.len(),
                MAX_ITEMS_PER_PAGE
            );
        }
        let mut ids = vec![];
        for product in msg.products {
            let mut p = Product::get(&deps.as_ref(), product.product_id.u64())?;
            if p.owner != info.sender {
                return Err(ContractError::Unauthorized {});
            }
            if let Some(price) = product.price {
                p.price = price;
            }
            if let Some(listed) = product.listed {
                p.listed = listed;
            }
            if let Some(meta_data_url) = product.meta_data_url {
                p.meta_data_url = meta_data_url;
            }
            p.last_updated_at = Some((env.block.time.seconds() * 1000).into());
            p.save(deps)?;
            ids.push(p.id.to_string());
        }
        Ok(Response::new().add_attributes(vec![
            ("action", "update_bulk_products"),
            ("owner", &info.sender.to_string()),
            ("product_ids", &ids.join(", ")),
        ]))
    }
}

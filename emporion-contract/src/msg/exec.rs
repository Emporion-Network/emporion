use crate::state::bnk::BankDistribution;
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Decimal, Uint128, Uint64};

#[cw_serde]
pub struct InstantiateMsg {
    pub platform_fee: Decimal,
    pub publish_fee: Uint128,
    pub distribution: BankDistribution,
    pub accepted_denom: String,
    pub rewards_distribution_address: String,
    pub fund_id: Uint64,
}

#[cw_serde]
pub struct CreateProductMsg {
    pub listed: bool,
    pub price: Uint128,
    pub meta_data_url: String,
}

#[cw_serde]

pub struct CreateBulkProductsMsg {
    pub products: Vec<CreateProductMsg>,
}

#[cw_serde]
pub struct UpdateProductMsg {
    pub product_id: Uint64,
    pub meta_data_url: Option<String>,
    pub listed: Option<bool>,
    pub price: Option<Uint128>,
}

#[cw_serde]
pub struct UpdateBulkProductMsg {
    pub products: Vec<UpdateProductMsg>,
}

#[cw_serde]
pub struct OrderForSeller {
    pub product_ids: Vec<Uint64>,
    pub loss_distribution_ratio: Decimal,
}

#[cw_serde]
pub struct CreateOrderMsg {
    pub orders: Vec<OrderForSeller>,
}

#[cw_serde]
pub struct AcceptOrderMsg {
    pub order_id: Uint64,
}

#[cw_serde]
pub struct DisputeOrderMsg {
    pub order_id: Uint64,
}

#[cw_serde]
pub struct RejectOrderMsg {
    pub order_id: Uint64,
}

#[cw_serde]
pub struct CancelOrderMsg {
    pub order_id: Uint64,
}

#[cw_serde]
pub struct CompleteOrderMsg {
    pub order_id: Uint64,
}

#[cw_serde]
pub struct RateUserMsg {
    pub user: String,
    pub order_id: Uint64,
    pub mark: u8,
    pub comment: String,
}

#[cw_serde]
pub struct UpdateParamsMsg {
    pub platform_fee: Option<Decimal>,
    pub publish_fee: Option<Uint128>,
    pub distribution: Option<BankDistribution>,
    pub admin: Option<String>,
    pub rewards_distribution_address: Option<String>,
}

#[cw_serde]
pub struct DistributeMsg {}

#[cw_serde]
pub enum ExecuteMsg {
    // Product related messages
    CreateProduct(CreateProductMsg),
    CreateBulkProducts(CreateBulkProductsMsg),
    UpdateProduct(UpdateProductMsg),
    UpdateBulkProduct(UpdateBulkProductMsg),
    // Order related messages
    CreateOrder(CreateOrderMsg),
    AcceptOrder(AcceptOrderMsg),
    CancelOrder(CancelOrderMsg),
    CompleteOrder(CompleteOrderMsg),
    DisputeOrder(DisputeOrderMsg),
    // Ratings
    UpsertRating(RateUserMsg),

    // Distribution
    Distribute(DistributeMsg),

    UpdateParams(UpdateParamsMsg),
}

#[cw_serde]
pub struct MigrateMsg {}

use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;
use cw2::ContractVersion;
use cw20::Cw20ReceiveMsg;
use cw_asset::{AssetInfoUnchecked, AssetListUnchecked};
use cw_utils::Duration;

use crate::state::{Bank, ContractParams, Distribution, Order, Product, Review, User};

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

    #[returns(ContractParams)]
    Params {},

    #[returns(Bank)]
    Bank {},

    #[returns(VotingPowerAtHeightResponse)]
    VotingPowerAtHeight {
        address: String,
        height: Option<u64>,
    },

    #[returns(User)]
    UserStats { addr: String },

    #[returns((Vec<Order>, Option<u64>))]
    OrdersFromBuyer {
        addr: String,
        start_from: Option<u64>,
    },

    #[returns(Order)]
    Order{order_id:u64},

    #[returns((Vec<Order>, Option<u64>))]
    OrdersForSeller {
        addr: String,
        start_from: Option<u64>,
    },

    #[returns((Vec<Review>, Option<u64>))]
    ReviewsOfProduct {
        product_id: u64,
        start_from: Option<u64>,
    },

    #[returns((Vec<Review>, Option<u64>))]
    ReviewsOfReviewed {
        addr: String,
        start_from: Option<u64>,
    },

    #[returns((Vec<Review>, Option<u64>))]
    ReviewsFromReviewer {
        addr: String,
        start_from: Option<u64>,
    },

    #[returns((Vec<Product>, Option<u64>))]
    ProductsOfSeller {
        addr: String,
        start_from: Option<u64>,
    },

    #[returns((Vec<Product>, Option<u64>))]
    ProductAll { start_from: Option<u64> },

    #[returns(Product)]
    ProductById{product_id:u64}
}

///////////////////////
///   ExecuteMsg    ///
///////////////////////

#[cw_serde]
pub enum ReceiverExecuteMsg {
    Invest {},
    CreateOrder(CreateOrderExecuteMsg),
    CreateProduct(CreateProductExecuteMessage),
    AddProductsToOrder {
        order_id: u64,
        cart: Vec<(u64, AssetInfoUnchecked)>,
    },
}

#[cw_serde]
pub struct CreateOrderExecuteMsg {
    pub seller: String,
    pub cart: Vec<(u64, AssetInfoUnchecked)>,
    pub buyer_risk_share: (u64, u64),
    pub ready: bool,
}

#[cw_serde]
pub struct CreateProductExecuteMessage {
    pub price: AssetListUnchecked,
    pub meta: String,
    pub is_listed: bool,
    pub delivery_time:Duration,
    pub meta_hash:String,
}

#[cw_serde]
pub struct ReviewUserExecuteMsg {
    // a valid order is required to rate a user
    pub order_id: u64,
    pub rating: u8,
    pub message: String,
}

#[cw_serde]
pub struct ReviewProductExecuteMsg {
    // a valid order is required to rate a product
    pub order_id: u64,
    pub product_id: u64,
    pub rating: u8,
    pub message: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    Blacklist(Vec<String>),
    Unblacklist(Vec<String>),
    Invest {},
    Divest {
        to_divest: AssetListUnchecked,
    },
    Withdraw {},
    CreateOrder(CreateOrderExecuteMsg),
    AcceptOrder {
        order_id: u64,
    },
    FinalizeOrder {
        order_id: u64,
    },
    AddProductsToOrder {
        order_id: u64,
        cart: Vec<(u64, AssetInfoUnchecked)>,
    },
    RejectOrder {
        order_id: u64,
    },
    FulfillOrder {
        order_id: u64,
    },
    DisputeOrder {
        order_id: u64,
    },
    ReviewUser(ReviewUserExecuteMsg),
    ReviewProduct(ReviewProductExecuteMsg),
    CreateProduct(CreateProductExecuteMessage),
    ListProduct {
        product_id: u64,
    },
    UnListProduct {
        product_id: u64,
    },
    Receive(Cw20ReceiveMsg),
    DistributeRewards {},
    UpdateParams(InstantiateMsg),
    UpdateAdmin{new_admin:String},
    WithdrawToDev{
        amount:AssetListUnchecked,
        to:String,
    }
}

///////////////////////
/// InstantiateMsg  ///
///////////////////////

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub dev:String,
    pub fee_distribution: Distribution,
    pub investment_distribution: Distribution,
    pub fee_ratio: (u64, u64),
    pub publication_fee: AssetListUnchecked,
    pub publication_fee_distribution: Distribution,
    pub weighted_accepted_assets: Vec<(AssetInfoUnchecked, u64)>,
    pub unbounding_duration: Duration,
    pub reward_rate: Duration,
    pub max_contract_risk_share: (u64, u64),
}

///////////////////////
///   MigrateMsg    ///
///////////////////////

#[cw_serde]
pub struct MigrateMsg {}

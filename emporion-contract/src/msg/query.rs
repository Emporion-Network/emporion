use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Empty, Uint64};

use crate::state::{
    bnk::Bank,
    order::Order,
    params::Params,
    product::Product,
    rating::{Mark, Rating},
};

#[cw_serde]
pub struct GetByAddress {
    pub addr: String,
}

#[cw_serde]
pub struct ByIndex {
    pub id: Uint64,
}

#[cw_serde]
pub struct PaginatedByAddress {
    pub addr: String,
    pub pagination: Paginated,
}

#[cw_serde]
pub struct PaginatedByIndex {
    pub id: Uint64,
    pub pagination: Paginated,
}

#[cw_serde]
pub struct Paginated {
    pub start_after: Option<Uint64>,
    pub limit: Option<u32>,
}

#[derive(QueryResponses)]
#[cw_serde]
pub enum QueryMsg {
    #[returns(Params)]
    GetParams(Empty),
    #[returns(Bank)]
    GetDistribution(Empty),
    // Product queries
    #[returns(Product)]
    GetProduct(ByIndex),
    #[returns(Vec<Product>)]
    ListAllProducts(Paginated),
    #[returns(Vec<Product>)]
    ListProductsFromUser(PaginatedByAddress),

    // Order queries
    #[returns(Order)]
    GetOrder(ByIndex),
    #[returns(Vec<Order>)]
    ListAllOrders(Paginated),
    #[returns(Vec<Order>)]
    ListOrdersForUser(PaginatedByAddress),
    #[returns(Vec<Order>)]
    ListOrdersFromUser(PaginatedByAddress),

    // Rating queries
    #[returns(Rating)]
    GetRating(ByIndex),
    #[returns(Vec<Rating>)]
    ListAllRatings(Paginated),
    #[returns(Vec<Rating>)]
    ListRatingsForUser(PaginatedByAddress),
    #[returns(Vec<Rating>)]
    ListRatingsFromUser(PaginatedByAddress),
    #[returns(Vec<Rating>)]
    ListRatingsByOrder(PaginatedByIndex),
    #[returns(Mark)]
    GetMark(GetByAddress),
}

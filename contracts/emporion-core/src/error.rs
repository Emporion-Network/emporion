use cosmwasm_std::{Addr, StdError};
use cw_asset::{Asset, AssetError, AssetInfo};
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    StdError(#[from] StdError),

    #[error("Invalid Distribution, distributions should sum up to one")]
    InvalidDistribution {},

    #[error("User {addr} not found")]
    UserNotFound { addr: Addr },

    #[error("Product with id:{id} not found")]
    ProductNotFound { id: u64 },

    #[error("Review with id:{id} not found")]
    ReviewNotFound { id: u64 },

    #[error("Invalid Fee")]
    InvalidFee {},

    #[error("Invalid cart")]
    InvalidCart {},

    #[error("Invalid asset {asset}")]
    InvalidAsset { asset: Asset },

    #[error("Invalid accepted assets")]
    InvalidAcceptedAssets {},

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Address ({addr}) is blacklisted")]
    AddressIsBlacklisted { addr: Addr },

    #[error(transparent)]
    AssetError(#[from] AssetError),

    #[error("Asset not accepted")]
    AssetNotAccepted {},

    #[error("Asset {asset} not found")]
    AssetNotFound { asset: AssetInfo },

    #[error("Asset {numerator}/{denominator} not found")]
    InvalidRiskShare { numerator: u64, denominator: u64 },

    #[error("Invalid review")]
    InvalidReview {},

    #[error("Invalid duration")]
    InvalidDuration {},

    #[error("Invalid price")]
    InvalidPrice{},

    #[error("Invalid meta hash")]
    InvalidMetaHash{},

    #[error("Invalid alias size")]
    InvalidAliasSize{},

}

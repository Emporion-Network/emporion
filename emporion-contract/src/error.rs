use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("{0}")]
    CheckedMultiplyRatioError(#[from] cosmwasm_std::CheckedMultiplyRatioError),
    #[error("Unauthorized")]
    Unauthorized {},
    #[error("Error {0}")]
    Custom(String),
}

#[macro_export]
macro_rules! error {
    ($($t:tt)*) => {{
        Err(ContractError::Custom(format!($($t)*)))
    }}
}

impl ContractError {
    pub fn custom(msg: impl Into<String>) -> Self {
        Self::Custom(msg.into())
    }
}

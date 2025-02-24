pub const MAX_ITEMS_PER_PAGE: u32 = 100;
pub const MAX_STRING_SIZE: usize = 2048;
const CONTRACT_NAME: &str = "emprion-contract";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
pub mod contract;
pub mod error;
pub mod msg;
pub mod state;

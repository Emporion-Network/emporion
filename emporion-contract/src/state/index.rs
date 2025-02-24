use cosmwasm_std::DepsMut;
use cw_storage_plus::Item;

use crate::error::ContractError;

const INDEX: Item<u64> = Item::new("index");

pub struct Index {}

impl Index {
    pub fn instantiate(
        deps: &mut DepsMut,
    ) -> Result<Vec<(impl Into<String>, impl Into<String>)>, ContractError> {
        INDEX.save(deps.storage, &0)?;
        Ok(vec![("action", "instantiate_index".to_string())])
    }
    pub fn next(deps: &mut DepsMut) -> Result<u64, ContractError> {
        INDEX.update(deps.storage, |v| Ok::<_, ContractError>(v + 1))
    }
}

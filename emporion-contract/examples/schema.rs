use cosmwasm_schema::write_api;
use emporion_contract::msg::exec::{ExecuteMsg, InstantiateMsg, MigrateMsg};
use emporion_contract::msg::query::QueryMsg;

fn main() {
    write_api! {
        instantiate: InstantiateMsg,
        query: QueryMsg,
        execute: ExecuteMsg,
        migrate: MigrateMsg,
    }
}

#[cfg(test)]
mod tests {

    use cosmwasm_std::{coins, to_json_binary, Addr, Coin, Empty, Uint128};
    use cw20::{BalanceResponse, Cw20Coin, Cw20ExecuteMsg, Cw20QueryMsg};
    use cw20_base::ContractError;

    use crate::msg::{
        CreateOrderExecuteMsg, CreateProductExecuteMessage, ExecuteMsg, InfoResponse,
        InstantiateMsg, QueryMsg, ReviewProductExecuteMsg, ReviewUserExecuteMsg,
        TotalPowerAtHeightResponse, VotingPowerAtHeightResponse,
    };
    use crate::state::{
        Bank, ContractParams, Distribution, Order, OrderStatus, Product, Review, ReviewOf, User,
    };
    use cw_asset::{
        Asset, AssetInfo, AssetInfoUnchecked, AssetList, AssetListBase, AssetListUnchecked,
    };
    use cw_multi_test::error::AnyError;
    use cw_multi_test::{App, Contract, ContractWrapper, Executor};
    use cw_utils::{Duration, WEEK};

    pub fn contract_store() -> Box<dyn Contract<Empty>> {
        let contract = ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        );
        Box::new(contract)
    }

    pub fn contract_cw20() -> Box<dyn Contract<Empty>> {
        let contract = ContractWrapper::new(
            cw20_base::contract::execute,
            cw20_base::contract::instantiate,
            cw20_base::contract::query,
        );
        Box::new(contract)
    }

    fn init_app(
        admin: &Addr,
        init_funds: Vec<(Addr, Vec<Coin>)>,
        init_funds_cw20: Vec<Cw20Coin>,
        init_params: Option<InstantiateMsg>,
    ) -> Result<(App, Addr, Addr, Addr), AnyError> {
        let mut router = App::new(|router, _, storage| {
            init_funds.clone().into_iter().for_each(|(owner, funds)| {
                router.bank.init_balance(storage, &owner, funds).unwrap();
            })
        });
        let cw20_id = router.store_code(contract_cw20());
        let store_id = router.store_code(contract_store());

        let msg = cw20_base::msg::InstantiateMsg {
            name: "Cash Money".to_string(),
            symbol: "CASH".to_string(),
            decimals: 2,
            initial_balances: init_funds_cw20.clone(),
            mint: None,
            marketing: None,
        };
        let cash_addr = router
            .instantiate_contract(cw20_id, admin.clone(), &msg, &[], "CASH", None)
            .unwrap();

        let msg = cw20_base::msg::InstantiateMsg {
            name: "Other Money".to_string(),
            symbol: "OTHER".to_string(),
            decimals: 2,
            initial_balances: init_funds_cw20,
            mint: None,
            marketing: None,
        };
        let other_cw20 = router
            .instantiate_contract(cw20_id, admin.clone(), &msg, &[], "CASH", None)
            .unwrap();
        let mut weighted_accepted_assets =
            vec![(AssetInfoUnchecked::Cw20(cash_addr.to_string()), 1)];
        let mut accepted = init_funds
            .clone()
            .into_iter()
            .map(|e| e.1)
            .flatten()
            .map(|c| c.denom)
            .collect::<Vec<_>>();
        accepted.sort();
        accepted.dedup();
        accepted.into_iter().for_each(|denom| {
            weighted_accepted_assets.push((AssetInfoUnchecked::native(denom), 1))
        });
        let init_params = init_params.unwrap_or(InstantiateMsg {
            admin: admin.to_string(),
            fee_distribution: Distribution {
                to_dev: (1, 4),
                to_investors: (1, 4),
                to_claim_reserve: (2, 4),
            },
            fee: (1, 100),
            publication_fee: AssetList::from(vec![
                Asset::cw20(cash_addr.clone(), 9u128),
                Asset::native("atom", 9u128),
            ])
            .into(),
            investment_distribution: Distribution {
                to_dev: (1, 4),
                to_investors: (0, 4),
                to_claim_reserve: (3, 4),
            },
            publication_fee_distribution: Distribution {
                to_dev: (0, 3),
                to_investors: (2, 3),
                to_claim_reserve: (1, 3),
            },
            weighted_accepted_assets,
            reward_rate: Duration::Height(5),
            unbounding_duration: Duration::Height(10),
            max_contract_risk_share: (1, 2),
        });

        let store_addr = router.instantiate_contract(
            store_id,
            admin.clone(),
            &init_params,
            &[],
            "Store",
            None,
        )?;
        return Ok((router, store_addr, cash_addr, other_cw20));
    }

    fn next_n_blocks(app: &mut App, n: Option<u64>) {
        let n = n.unwrap_or(1);
        app.update_block(|b| b.height += n)
    }

    fn add_days(app: &mut App, days: Option<u64>) {
        let n = days.unwrap_or(7);
        app.update_block(|b| {
            b.time = b.time.plus_days(n);
        })
    }
    ///////////////////////////////////////////////////////////////////
    //////////////////////////   Exec helpers  ////////////////////////
    ///////////////////////////////////////////////////////////////////

    fn exec_create_product(
        app: &mut App,
        store_addr: &Addr,
        seller: &Addr,
        price: AssetListUnchecked,
        is_listed: bool,
        meta: String,
        publication_fee: Option<Vec<Coin>>,
        delivery_time: Option<Duration>,
    ) -> Result<u64, AnyError> {
        let resp = app.execute_contract(
            seller.clone(),
            store_addr.clone(),
            &ExecuteMsg::CreateProduct(CreateProductExecuteMessage {
                price,
                is_listed,
                meta,
                delivery_time: delivery_time.unwrap_or(WEEK),
            }),
            &publication_fee.unwrap_or(vec![]),
        )?;
        let evt = resp.events.into_iter().find(|e| e.ty == "wasm").unwrap();
        let attr = evt
            .attributes
            .into_iter()
            .find(|a| a.key == "product_id")
            .ok_or(AnyError::msg(""))?;
        Ok(u64::from_str_radix(&attr.value, 10)?)
    }

    fn exec_cw20_create_product(
        app: &mut App,
        cw20_addr: &Addr,
        store_addr: &Addr,
        seller: &Addr,
        price: AssetListUnchecked,
        is_active: bool,
        meta: String,
        publication_fee: u128,
    ) -> Result<u64, AnyError> {
        let msg = ExecuteMsg::CreateProduct(CreateProductExecuteMessage {
            price,
            is_listed: is_active,
            meta,
            delivery_time: WEEK,
        });
        let resp = app.execute_contract(
            seller.clone(),
            cw20_addr.clone(),
            &Cw20ExecuteMsg::Send {
                contract: store_addr.to_string(),
                amount: Uint128::from(publication_fee),
                msg: to_json_binary(&msg)?,
            },
            &[],
        )?;

        let attrs = resp
            .events
            .into_iter()
            .filter_map(|e| {
                if e.ty == "wasm" {
                    Some(e.attributes)
                } else {
                    None
                }
            })
            .flatten()
            .collect::<Vec<_>>();
        let attr = attrs
            .into_iter()
            .find(|a| a.key == "product_id")
            .ok_or(AnyError::msg(""))?;
        Ok(u64::from_str_radix(&attr.value, 10)?)
    }

    fn exec_blacklist(
        app: &mut App,
        store_addr: &Addr,
        admin: &Addr,
        to_blacklist: Vec<String>,
    ) -> Result<u64, AnyError> {
        let resp = app.execute_contract(
            admin.clone(),
            store_addr.clone(),
            &ExecuteMsg::Blacklist(to_blacklist),
            &[],
        )?;
        let evt = resp.events.into_iter().find(|e| e.ty == "wasm").unwrap();
        let attr = evt
            .attributes
            .into_iter()
            .find(|a| a.key == "blacklisted")
            .ok_or(AnyError::msg(""))?;
        Ok(u64::from_str_radix(&attr.value, 10)?)
    }

    fn exec_unblacklist(
        app: &mut App,
        store_addr: &Addr,
        admin: &Addr,
        to_unblacklist: Vec<String>,
    ) -> Result<u64, AnyError> {
        let resp = app.execute_contract(
            admin.clone(),
            store_addr.clone(),
            &ExecuteMsg::Unblacklist(to_unblacklist),
            &[],
        )?;
        let evt = resp.events.into_iter().find(|e| e.ty == "wasm").unwrap();
        let attr = evt
            .attributes
            .into_iter()
            .find(|a| a.key == "unblacklisted")
            .ok_or(AnyError::msg(""))?;
        Ok(u64::from_str_radix(&attr.value, 10)?)
    }

    fn exec_cw20_invest(
        app: &mut App,
        cw20_addr: &Addr,
        store_addr: &Addr,
        invester: &Addr,
        amout: u128,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            invester.clone(),
            cw20_addr.clone(),
            &Cw20ExecuteMsg::Send {
                contract: store_addr.to_string(),
                amount: Uint128::from(amout),
                msg: to_json_binary(&ExecuteMsg::Invest {})?,
            },
            &[],
        )?;
        Ok(())
    }

    fn exec_invest(
        app: &mut App,
        store_addr: &Addr,
        invester: &Addr,
        funds: Vec<Coin>,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            invester.clone(),
            store_addr.clone(),
            &ExecuteMsg::Invest {},
            &funds,
        )?;
        Ok(())
    }

    fn exec_divest(
        app: &mut App,
        store_addr: &Addr,
        divester: &Addr,
        list: AssetList,
    ) -> Result<(), AnyError> {
        let msg = ExecuteMsg::Divest {
            to_divest: list.into(),
        };
        app.execute_contract(divester.clone(), store_addr.clone(), &msg, &[])?;
        Ok(())
    }

    fn exec_withdraw(app: &mut App, store_addr: &Addr, divester: &Addr) -> Result<(), AnyError> {
        let msg = ExecuteMsg::Withdraw {};
        app.execute_contract(divester.clone(), store_addr.clone(), &msg, &[])?;
        Ok(())
    }

    fn exec_withdraw_dev_to(
        app: &mut App,
        store_addr: &Addr,
        admin: &Addr,
        to: &Addr,
        amount: AssetListUnchecked,
    ) -> Result<(), AnyError> {
        let msg = ExecuteMsg::WithdrawToDev {
            amount,
            to: to.to_string(),
        };
        app.execute_contract(admin.clone(), store_addr.clone(), &msg, &[])?;
        Ok(())
    }

    fn exec_cw20_create_order(
        app: &mut App,
        cw20_addr: &Addr,
        store_addr: &Addr,
        buyer: &Addr,
        msg: CreateOrderExecuteMsg,
        amout: u128,
    ) -> Result<u64, AnyError> {
        let msg = Cw20ExecuteMsg::Send {
            contract: store_addr.to_string(),
            msg: to_json_binary(&ExecuteMsg::CreateOrder(msg))?,
            amount: amout.into(),
        };
        let resp = app.execute_contract(buyer.clone(), cw20_addr.clone(), &msg, &[])?;
        let attrs = resp
            .events
            .into_iter()
            .filter_map(|e| {
                if e.ty == "wasm" {
                    Some(e.attributes)
                } else {
                    None
                }
            })
            .flatten()
            .collect::<Vec<_>>();
        let attr = attrs
            .into_iter()
            .find(|a| a.key == "order_id")
            .ok_or(AnyError::msg(""))?;
        Ok(u64::from_str_radix(&attr.value, 10)?)
    }

    fn exec_create_order(
        app: &mut App,
        store_addr: &Addr,
        buyer: &Addr,
        msg: CreateOrderExecuteMsg,
        amout: Vec<Coin>,
    ) -> Result<u64, AnyError> {
        let resp = app.execute_contract(
            buyer.clone(),
            store_addr.clone(),
            &ExecuteMsg::CreateOrder(msg),
            &amout,
        )?;
        let attrs = resp
            .events
            .into_iter()
            .filter_map(|e| {
                if e.ty == "wasm" {
                    Some(e.attributes)
                } else {
                    None
                }
            })
            .flatten()
            .collect::<Vec<_>>();
        let attr = attrs
            .into_iter()
            .find(|a| a.key == "order_id")
            .ok_or(AnyError::msg(""))?;
        Ok(u64::from_str_radix(&attr.value, 10)?)
    }

    fn exec_list(
        app: &mut App,
        store_addr: &Addr,
        seller: &Addr,
        product_id: u64,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            seller.clone(),
            store_addr.clone(),
            &ExecuteMsg::ListProduct { product_id },
            &[],
        )?;
        Ok(())
    }

    fn exec_unlist(
        app: &mut App,
        store_addr: &Addr,
        seller: &Addr,
        product_id: u64,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            seller.clone(),
            store_addr.clone(),
            &ExecuteMsg::UnListProduct { product_id },
            &[],
        )?;
        Ok(())
    }

    fn exec_cw20_add_products(
        app: &mut App,
        store_addr: &Addr,
        cw20_addr: &Addr,
        buyer: &Addr,
        order_id: u64,
        cart: Vec<(u64, AssetInfoUnchecked)>,
        amount: u128,
    ) -> Result<(), AnyError> {
        let msg = Cw20ExecuteMsg::Send {
            contract: store_addr.to_string(),
            msg: to_json_binary(&ExecuteMsg::AddProductsToOrder { order_id, cart })?,
            amount: amount.into(),
        };
        app.execute_contract(buyer.clone(), cw20_addr.clone(), &msg, &[])?;

        Ok(())
    }

    fn exec_add_products(
        app: &mut App,
        store_addr: &Addr,
        buyer: &Addr,
        order_id: u64,
        cart: Vec<(u64, AssetInfoUnchecked)>,
        amount: Vec<Coin>,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            buyer.clone(),
            store_addr.clone(),
            &ExecuteMsg::AddProductsToOrder { order_id, cart },
            &amount,
        )?;

        Ok(())
    }

    fn exec_finalize(
        app: &mut App,
        store_addr: &Addr,
        buyer: &Addr,
        order_id: u64,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            buyer.clone(),
            store_addr.clone(),
            &ExecuteMsg::FinalizeOrder { order_id },
            &[],
        )?;
        Ok(())
    }

    fn exec_accept(
        app: &mut App,
        store_addr: &Addr,
        seller: &Addr,
        order_id: u64,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            seller.clone(),
            store_addr.clone(),
            &ExecuteMsg::AcceptOrder { order_id },
            &[],
        )?;
        Ok(())
    }

    fn exec_reject(
        app: &mut App,
        store_addr: &Addr,
        user: &Addr,
        order_id: u64,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            user.clone(),
            store_addr.clone(),
            &ExecuteMsg::RejectOrder { order_id },
            &[],
        )?;
        Ok(())
    }

    fn exec_fulfill(
        app: &mut App,
        store_addr: &Addr,
        user: &Addr,
        order_id: u64,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            user.clone(),
            store_addr.clone(),
            &ExecuteMsg::FulfillOrder { order_id },
            &[],
        )?;
        Ok(())
    }

    fn exec_dispute(
        app: &mut App,
        store_addr: &Addr,
        user: &Addr,
        order_id: u64,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            user.clone(),
            store_addr.clone(),
            &ExecuteMsg::DisputeOrder { order_id },
            &[],
        )?;
        Ok(())
    }

    fn exec_distribute(app: &mut App, store_addr: &Addr, user: &Addr) -> Result<(), AnyError> {
        app.execute_contract(
            user.clone(),
            store_addr.clone(),
            &ExecuteMsg::DistributeRewards {},
            &[],
        )?;
        Ok(())
    }

    fn exec_review_user(
        app: &mut App,
        store_addr: &Addr,
        user: &Addr,
        msg: ReviewUserExecuteMsg,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            user.clone(),
            store_addr.clone(),
            &ExecuteMsg::ReviewUser(msg),
            &[],
        )?;
        Ok(())
    }

    fn exec_review_product(
        app: &mut App,
        store_addr: &Addr,
        user: &Addr,
        msg: ReviewProductExecuteMsg,
    ) -> Result<(), AnyError> {
        app.execute_contract(
            user.clone(),
            store_addr.clone(),
            &ExecuteMsg::ReviewProduct(msg),
            &[],
        )?;
        Ok(())
    }

    ///////////////////////////////////////////////////////////////////
    //////////////////////////  Query helpers  ////////////////////////
    ///////////////////////////////////////////////////////////////////

    fn query_products_all(
        app: &mut App,
        store_addr: &Addr,
        next: Option<u64>,
    ) -> Result<(Vec<Product>, Option<u64>), ContractError> {
        let res: (Vec<Product>, Option<u64>) = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::ProductAll { start_from: next },
        )?;
        Ok(res)
    }

    fn query_products_of(
        app: &mut App,
        store_addr: &Addr,
        seller: &Addr,
        next: Option<u64>,
    ) -> Result<(Vec<Product>, Option<u64>), ContractError> {
        let res: (Vec<Product>, Option<u64>) = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::ProductsOfSeller {
                addr: seller.to_string(),
                start_from: next,
            },
        )?;
        Ok(res)
    }

    fn query_balance_cw20(app: &App, cw20_addr: &Addr, owner: &Addr) -> Uint128 {
        let resp: BalanceResponse = app
            .wrap()
            .query_wasm_smart(
                cw20_addr,
                &Cw20QueryMsg::Balance {
                    address: owner.to_string(),
                },
            )
            .unwrap();
        resp.balance
    }

    fn query_user_stats(app: &App, store_addr: &Addr, addr: &Addr) -> Result<User, ContractError> {
        let res: User = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::UserStats {
                addr: addr.to_string(),
            },
        )?;
        Ok(res)
    }

    fn query_bank(app: &App, store_addr: &Addr) -> Result<Bank, ContractError> {
        let res: Bank = app
            .wrap()
            .query_wasm_smart(store_addr.clone(), &QueryMsg::Bank {})?;
        Ok(res)
    }

    fn query_product(app: &App, store_addr: &Addr, id: u64) -> Result<Product, ContractError> {
        let res: Product = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::ProductById { product_id: id },
        )?;
        Ok(res)
    }

    fn query_order(app: &App, store_addr: &Addr, id: u64) -> Result<Order, ContractError> {
        let res: Order = app
            .wrap()
            .query_wasm_smart(store_addr.clone(), &QueryMsg::Order { order_id: id })?;
        Ok(res)
    }

    fn query_power_at(
        app: &App,
        store_addr: &Addr,
        of: &Addr,
        height: Option<u64>,
    ) -> Result<VotingPowerAtHeightResponse, ContractError> {
        let res: VotingPowerAtHeightResponse = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::VotingPowerAtHeight {
                address: of.to_string(),
                height,
            },
        )?;
        Ok(res)
    }

    fn query_total_power_at(
        app: &App,
        store_addr: &Addr,
        height: Option<u64>,
    ) -> Result<TotalPowerAtHeightResponse, ContractError> {
        let res: TotalPowerAtHeightResponse = app
            .wrap()
            .query_wasm_smart(store_addr.clone(), &QueryMsg::TotalPowerAtHeight { height })?;
        Ok(res)
    }

    fn query_info(app: &App, store_addr: &Addr) -> Result<InfoResponse, ContractError> {
        let res: InfoResponse = app
            .wrap()
            .query_wasm_smart(store_addr.clone(), &QueryMsg::Info {})?;
        Ok(res)
    }

    fn query_params(app: &App, store_addr: &Addr) -> Result<ContractParams, ContractError> {
        let res: ContractParams = app
            .wrap()
            .query_wasm_smart(store_addr.clone(), &QueryMsg::Params {})?;
        Ok(res)
    }

    fn query_orders_for(
        app: &App,
        store_addr: &Addr,
        addr: &Addr,
        start_from: Option<u64>,
    ) -> Result<(Vec<Order>, Option<u64>), ContractError> {
        let res: (Vec<Order>, Option<u64>) = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::OrdersForSeller {
                addr: addr.to_string(),
                start_from,
            },
        )?;
        Ok(res)
    }

    fn query_orders_from(
        app: &App,
        store_addr: &Addr,
        addr: &Addr,
        start_from: Option<u64>,
    ) -> Result<(Vec<Order>, Option<u64>), ContractError> {
        let res: (Vec<Order>, Option<u64>) = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::OrdersFromBuyer {
                addr: addr.to_string(),
                start_from,
            },
        )?;
        Ok(res)
    }

    fn query_reviews_from(
        app: &mut App,
        store_addr: &Addr,
        user: &Addr,
        next: Option<u64>,
    ) -> Result<(Vec<Review>, Option<u64>), ContractError> {
        let res: (Vec<Review>, Option<u64>) = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::ReviewsFromReviewer {
                addr: user.to_string(),
                start_from: next,
            },
        )?;
        Ok(res)
    }

    fn query_reviews_of(
        app: &mut App,
        store_addr: &Addr,
        user: &Addr,
        next: Option<u64>,
    ) -> Result<(Vec<Review>, Option<u64>), ContractError> {
        let res: (Vec<Review>, Option<u64>) = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::ReviewsOfReviewed {
                addr: user.to_string(),
                start_from: next,
            },
        )?;
        Ok(res)
    }

    fn query_reviews_of_product(
        app: &mut App,
        store_addr: &Addr,
        product_id: u64,
        next: Option<u64>,
    ) -> Result<(Vec<Review>, Option<u64>), ContractError> {
        let res: (Vec<Review>, Option<u64>) = app.wrap().query_wasm_smart(
            store_addr.clone(),
            &QueryMsg::ReviewsOfProduct {
                product_id,
                start_from: next,
            },
        )?;
        Ok(res)
    }

    ///////////////////////////////////////////////////////////////////
    //////////////////////////      Tests      ////////////////////////
    ///////////////////////////////////////////////////////////////////

    ///////////////////////
    ///     Product     ///
    ///////////////////////

    #[test]
    fn product_tests_cw20() -> Result<(), AnyError> {
        // 1. Check that i can create a product
        // 2. Check that creating a product with an unlisted coin fails
        // 3. Check that blacklisted users can't create products
        // 4. Check pagination
        // 5. Check fee distribution
        let admin = Addr::unchecked("admin");
        let buyer = Addr::unchecked("buyer");
        let seller = Addr::unchecked("seller");

        let (mut app, store_addr, cash_addr, _) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            None,
        )?;

        assert_eq!(
            query_balance_cw20(&app, &cash_addr, &buyer),
            Uint128::new(5000)
        );
        let valid_price = AssetList::from(vec![Asset::cw20(cash_addr.clone(), 1000u128)]);
        let invalid_price = AssetList::from(vec![Asset::cw20(buyer.clone(), 1000u128)]);

        for i in 1..11 {
            let product_id = exec_cw20_create_product(
                &mut app,
                &cash_addr,
                &store_addr,
                &seller,
                valid_price.clone().into(),
                true,
                "".to_string(),
                9,
            )?;
            assert_eq!(product_id, i);
        }

        let bnk = query_bank(&app, &store_addr)?;
        let cahch_info = AssetInfo::cw20(cash_addr.clone());
        assert_eq!(
            bnk.to_claim_reserve
                .find(&cahch_info)
                .map(|a| a.amount.u128()),
            Some(30)
        );
        assert_eq!(bnk.to_dev.find(&cahch_info).map(|a| a.amount.u128()), None);
        assert_eq!(
            bnk.to_investors.find(&cahch_info).map(|a| a.amount.u128()),
            Some(60)
        );

        let should_be_err = exec_cw20_create_product(
            &mut app,
            &cash_addr,
            &store_addr,
            &seller,
            invalid_price.clone().into(),
            true,
            "".to_string(),
            9,
        );
        assert!(should_be_err.is_err());

        let nb_blacklisted =
            exec_blacklist(&mut app, &store_addr, &admin, vec![seller.to_string()])?;
        assert_eq!(nb_blacklisted, 1);

        let should_be_err = exec_cw20_create_product(
            &mut app,
            &cash_addr,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            9,
        );
        assert!(should_be_err.is_err());

        let mut nxt = None;
        for _ in 0..10 {
            let (pts, next) = query_products_all(&mut app, &store_addr, nxt)?;
            assert_eq!(pts.len(), 2);
            nxt = next;
        }
        assert_eq!(nxt, None);

        Ok(())
    }

    #[test]
    fn product_tests_native() -> Result<(), AnyError> {
        // 1. Check that i can create a product
        // 2. Check that creating a product with an unlisted coin fails
        // 3. Check that blacklisted users can't create products
        // 4. Check pagination
        // 5. Check fee distribution
        // 6. Check that cant create product without fee
        let admin = Addr::unchecked("admin");
        let buyer = Addr::unchecked("buyer");
        let seller = Addr::unchecked("seller");

        let (mut app, store_addr, cash_addr, _) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            None,
        )?;

        let valid_price = AssetList::from(vec![Asset::cw20(cash_addr.clone(), 1000u128)]);
        let invalid_price = AssetList::from(vec![Asset::cw20(buyer.clone(), 1000u128)]);

        for i in 1..11 {
            let product_id = exec_create_product(
                &mut app,
                &store_addr,
                &seller,
                valid_price.clone().into(),
                true,
                "".to_string(),
                Some(coins(9, "atom")),
                None,
            )?;
            assert_eq!(product_id, i);
        }

        let bnk = query_bank(&app, &store_addr)?;
        let native_info = AssetInfo::native("atom");
        assert_eq!(
            bnk.to_claim_reserve
                .find(&native_info)
                .map(|a| a.amount.u128()),
            Some(30)
        );
        assert_eq!(bnk.to_dev.find(&native_info).map(|a| a.amount.u128()), None);
        assert_eq!(
            bnk.to_investors.find(&native_info).map(|a| a.amount.u128()),
            Some(60)
        );

        let should_be_err = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            invalid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        );
        assert!(should_be_err.is_err());

        let nb_blacklisted =
            exec_blacklist(&mut app, &store_addr, &admin, vec![seller.to_string()])?;
        assert_eq!(nb_blacklisted, 1);
        // user is blacklisted
        let should_be_err = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        );
        assert!(should_be_err.is_err());

        let nb_unblacklisted =
            exec_unblacklist(&mut app, &store_addr, &admin, vec![seller.to_string()])?;
        assert_eq!(nb_unblacklisted, 1);

        // user can create products again

        let product_id = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        )?;
        assert_eq!(product_id, 11);

        // can't create a product if no fees are provided

        let should_err = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            None,
            None,
        );
        assert!(should_err.is_err());

        let mut nxt = None;
        // there are 11 products
        // 2 products per page
        // thus the first 5 pages are full
        for _ in 0..5 {
            let (pts, next) = query_products_all(&mut app, &store_addr, nxt)?;
            assert_eq!(pts.len(), 2);
            assert!(next.is_some());
            nxt = next;
        }
        // last page has only one product
        let (pts, next) = query_products_all(&mut app, &store_addr, nxt)?;
        assert_eq!(pts.len(), 1);
        assert_eq!(next, None);

        let should_be_err = query_product(&app, &store_addr, 404);
        assert!(should_be_err.is_err());

        let product_id = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            false,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        )?;
        let p = query_product(&app, &store_addr, product_id)?;
        assert!(!p.is_listed);
        let should_be_err = exec_list(&mut app, &store_addr, &buyer, product_id);
        assert!(should_be_err.is_err());
        exec_list(&mut app, &store_addr, &seller, product_id)?;
        let p = query_product(&app, &store_addr, product_id)?;
        assert!(p.is_listed);

        let should_be_err = exec_unlist(&mut app, &store_addr, &buyer, product_id);
        assert!(should_be_err.is_err());

        exec_unlist(&mut app, &store_addr, &seller, product_id)?;
        let p = query_product(&app, &store_addr, product_id)?;
        assert!(!p.is_listed);

        let mut nxt: Option<u64> = None;
        for _ in 0..5 {
            let (pts, next) = query_products_of(&mut app, &store_addr, &seller, nxt)?;
            assert_eq!(pts.len(), 2);
            assert!(next.is_some());
            nxt = next;
        }

        Ok(())
    }

    ///////////////////////
    ///       User      ///
    ///////////////////////
    #[test]
    fn user_tests() -> Result<(), AnyError> {
        // 1. ✅ Check that user can invest
        // 2. ✅ Check that cant divest more than allowed
        // 3. ✅ Check that user can divest
        // 4. Check that the bank distribution is correct
        // 5. Check that the voting power is correct
        // 6. Check that user stats are correct
        // 7. Check that power is correct
        // 8. Check that cant withdraw before timeout
        let admin = Addr::unchecked("admin");
        let buyer = Addr::unchecked("buyer");
        let seller = Addr::unchecked("seller");

        let (mut app, store_addr, cash_addr, _) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            None,
        )?;
        let TotalPowerAtHeightResponse { power, .. } =
            query_total_power_at(&app, &store_addr, None)?;
        assert_eq!(power.u128(), 0);
        let VotingPowerAtHeightResponse { power, .. } =
            query_power_at(&app, &store_addr, &buyer, None)?;
        assert_eq!(power.u128(), 0);
        exec_cw20_invest(&mut app, &cash_addr, &store_addr, &buyer, 500)?;
        let to_withdraw_ok = AssetList::from(vec![Asset::cw20(cash_addr.clone(), 125u128)]);
        let to_withdraw_err = AssetList::from(vec![Asset::cw20(cash_addr.clone(), 525u128)]);
        let should_err = exec_withdraw_dev_to(
            &mut app,
            &store_addr,
            &seller,
            &seller,
            to_withdraw_ok.clone().into(),
        );
        assert!(should_err.is_err());

        let should_err = exec_withdraw_dev_to(
            &mut app,
            &store_addr,
            &admin,
            &admin,
            to_withdraw_err.clone().into(),
        );
        assert!(should_err.is_err());

        let should_be_ok =
            exec_withdraw_dev_to(&mut app, &store_addr, &admin, &admin, to_withdraw_ok.into());
        assert!(should_be_ok.is_ok());

        next_n_blocks(&mut app, None);
        let bk = query_bank(&app, &store_addr)?;
        assert_eq!(
            bk.total_invested
                .find(&AssetInfo::cw20(cash_addr.clone()))
                .unwrap()
                .amount
                .u128(),
            500
        );
        assert_eq!(bk.to_dev.find(&AssetInfo::cw20(cash_addr.clone())), None);
        assert_eq!(
            bk.to_claim_reserve
                .find(&AssetInfo::cw20(cash_addr.clone()))
                .unwrap()
                .amount
                .u128(),
            375
        );
        let usr = query_user_stats(&app, &store_addr, &buyer)?;
        assert_eq!(
            usr.invested
                .find(&AssetInfo::cw20(cash_addr.clone()))
                .unwrap()
                .amount
                .u128(),
            500
        );

        let TotalPowerAtHeightResponse {
            power: total_power, ..
        } = query_total_power_at(&app, &store_addr, None)?;
        assert_eq!(total_power.u128(), 500);
        let VotingPowerAtHeightResponse {
            power: user_power, ..
        } = query_power_at(&app, &store_addr, &buyer, None)?;
        assert_eq!(user_power.u128(), 500);

        let shold_be_err = exec_divest(
            &mut app,
            &store_addr,
            &buyer,
            AssetList::from(vec![Asset::cw20(cash_addr.clone(), 5000u128)]),
        );
        assert!(shold_be_err.is_err());
        exec_divest(
            &mut app,
            &store_addr,
            &buyer,
            AssetList::from(vec![Asset::cw20(cash_addr.clone(), 500u128)]),
        )?;
        let bk = query_bank(&app, &store_addr)?;
        assert_eq!(
            bk.total_invested.find(&AssetInfo::cw20(cash_addr.clone())),
            None
        );
        assert_eq!(bk.to_dev.find(&AssetInfo::cw20(cash_addr.clone())), None);
        assert_eq!(
            bk.to_claim_reserve
                .find(&AssetInfo::cw20(cash_addr.clone())),
            None
        );
        let usr = query_user_stats(&app, &store_addr, &buyer)?;
        assert_eq!(usr.invested.find(&AssetInfo::cw20(cash_addr.clone())), None);
        assert_eq!(
            usr.unbonding.iter().find_map(|(a, _)| {
                if a.info == AssetInfo::cw20(cash_addr.clone()) {
                    Some(a.amount.u128())
                } else {
                    None
                }
            }),
            Some(375)
        );
        exec_withdraw(&mut app, &store_addr, &buyer)?;
        let usr = query_user_stats(&app, &store_addr, &buyer)?;
        assert_eq!(usr.invested.find(&AssetInfo::cw20(cash_addr.clone())), None);
        assert_eq!(
            usr.unbonding.iter().find_map(|(a, _)| {
                if a.info == AssetInfo::cw20(cash_addr.clone()) {
                    Some(a.amount.u128())
                } else {
                    None
                }
            }),
            Some(375)
        );
        next_n_blocks(&mut app, Some(10)); // wait for withdraw to be available

        exec_withdraw(&mut app, &store_addr, &buyer)?;
        let usr = query_user_stats(&app, &store_addr, &buyer)?;
        assert_eq!(usr.invested.find(&AssetInfo::cw20(cash_addr.clone())), None);
        assert_eq!(
            usr.unbonding.iter().find_map(|(a, _)| {
                if a.info == AssetInfo::cw20(cash_addr.clone()) {
                    Some(a.amount.u128())
                } else {
                    None
                }
            }),
            None
        );
        let TotalPowerAtHeightResponse { power, .. } =
            query_total_power_at(&app, &store_addr, None)?;
        assert_eq!(power.u128(), 0);
        let VotingPowerAtHeightResponse { power, .. } =
            query_power_at(&app, &store_addr, &buyer, None)?;
        assert_eq!(power.u128(), 0);

        // more users invest

        exec_cw20_invest(&mut app, &cash_addr, &store_addr, &seller, 700)?;
        exec_cw20_invest(&mut app, &cash_addr, &store_addr, &buyer, 500)?;
        next_n_blocks(&mut app, None);

        let TotalPowerAtHeightResponse { power, .. } =
            query_total_power_at(&app, &store_addr, None)?;
        assert_eq!(power.u128(), 700 + 500);
        let VotingPowerAtHeightResponse { power, .. } =
            query_power_at(&app, &store_addr, &buyer, None)?;
        assert_eq!(power.u128(), 500);

        let VotingPowerAtHeightResponse { power, .. } =
            query_power_at(&app, &store_addr, &seller, None)?;
        assert_eq!(power.u128(), 700);

        exec_blacklist(&mut app, &store_addr, &admin, vec![admin.to_string()])?;
        let VotingPowerAtHeightResponse {
            power: user_power, ..
        } = query_power_at(&app, &store_addr, &admin, None)?;
        assert_eq!(user_power.u128(), 0);

        let (mut app, store_addr, _, _) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![
                        Coin {
                            denom: "atom".to_string(),
                            amount: Uint128::new(5000),
                        },
                        Coin::new(5000, "blah"),
                    ],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            Some(InstantiateMsg {
                admin: admin.to_string(),
                fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                investment_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                fee: (1, 100),
                publication_fee: AssetListBase::new().into(),
                publication_fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                max_contract_risk_share: (1, 5),
                weighted_accepted_assets: vec![
                    (AssetInfoUnchecked::Cw20(cash_addr.to_string()), 1),
                    (AssetInfoUnchecked::Native("atom".to_string()), 1),
                ],
                unbounding_duration: Duration::Height(1),
                reward_rate: Duration::Height(2),
            }),
        )?;
        let shold_be_err = exec_invest(&mut app, &store_addr, &buyer, vec![Coin::new(100, "blah")]);
        assert!(shold_be_err.is_err());

        let should_be_ok = exec_invest(&mut app, &store_addr, &buyer, vec![Coin::new(100, "atom")]);
        assert!(should_be_ok.is_ok());

        Ok(())
    }

    ///////////////////////
    ///      Orders     ///
    ///////////////////////
    #[test]
    fn order_cw20_tests() -> Result<(), AnyError> {
        let admin = Addr::unchecked("admin");
        let buyer = Addr::unchecked("buyer");
        let seller = Addr::unchecked("seller");

        let (mut app, store_addr, cash_addr, ohter_cw20) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    admin.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: admin.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            None,
        )?;

        let valid_price = AssetList::from(vec![Asset::cw20(cash_addr.clone(), 800u128)]);

        let product_id = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        )?;
        assert_eq!(product_id, 1);

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![],
            ready: true,
        };
        let is_err =
            exec_cw20_create_order(&mut app, &cash_addr, &store_addr, &buyer, msg, 800u128);
        assert!(is_err.is_err());

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: true,
        };
        let is_ok = exec_cw20_create_order(&mut app, &cash_addr, &store_addr, &buyer, msg, 800u128);
        assert!(is_ok.is_ok());
        let finalized_order_id = is_ok.unwrap();
        let order = query_order(&app, &store_addr, finalized_order_id)?;
        assert_eq!(order.status, OrderStatus::Pending);

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: false,
        };
        let is_ok = exec_cw20_create_order(&mut app, &cash_addr, &store_addr, &buyer, msg, 800u128);
        assert!(is_ok.is_ok());
        let to_be_updated_id = is_ok.unwrap();

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        let s = query_user_stats(&app, &store_addr, &seller)?;

        assert_eq!(s.nb_orders, 1);
        assert_eq!(b.nb_orders, 1);

        let order = query_order(&app, &store_addr, to_be_updated_id)?;
        assert_eq!(order.status, OrderStatus::Creating);
        assert_eq!(order.products.len(), 1);

        let product_id = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            false,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        )?;

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: true,
        };

        let should_be_err = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            800u128,
        );
        assert!(should_be_err.is_err());

        exec_list(&mut app, &store_addr, &seller, product_id)?;

        let should_be_err = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            300u128,
        );
        assert!(should_be_err.is_err());

        let should_be_ok = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            800u128,
        );
        assert!(should_be_ok.is_ok());
        let other_order_id = should_be_ok?;

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        let s = query_user_stats(&app, &store_addr, &seller)?;

        assert_eq!(s.nb_orders, 2);
        assert_eq!(b.nb_orders, 2);

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(404, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: true,
        };
        let should_be_err = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            300u128,
        );
        assert!(should_be_err.is_err());

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(3, AssetInfo::cw20(buyer.clone()).into())],
            ready: true,
        };
        let should_be_err = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            800u128,
        );
        assert!(should_be_err.is_err());

        let msg = CreateOrderExecuteMsg {
            seller: buyer.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(3, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: true,
        };
        let should_be_err = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            800u128,
        );
        assert!(should_be_err.is_err());

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (5, 3),
            cart: vec![(3, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: true,
        };
        let should_be_err = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            800u128,
        );
        assert!(should_be_err.is_err());

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (5, 0),
            cart: vec![(3, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: true,
        };
        let should_be_err = exec_cw20_create_order(
            &mut app,
            &cash_addr,
            &store_addr,
            &buyer,
            msg.clone(),
            800u128,
        );
        assert!(should_be_err.is_err());

        let should_be_err = exec_cw20_create_order(
            &mut app,
            &ohter_cw20,
            &store_addr,
            &buyer,
            msg.clone(),
            800u128,
        );
        assert!(should_be_err.is_err());

        let product_other_seller_id = exec_create_product(
            &mut app,
            &store_addr,
            &admin,
            valid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        )?;

        let should_be_err = exec_cw20_add_products(
            &mut app,
            &store_addr,
            &cash_addr,
            &buyer,
            finalized_order_id,
            vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            125u128,
        );

        assert!(should_be_err.is_err());

        let should_be_err = exec_cw20_add_products(
            &mut app,
            &store_addr,
            &cash_addr,
            &buyer,
            finalized_order_id,
            vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            800u128,
        );
        assert!(should_be_err.is_err());

        let should_be_err = exec_cw20_add_products(
            &mut app,
            &store_addr,
            &cash_addr,
            &buyer,
            to_be_updated_id,
            vec![(
                product_other_seller_id,
                AssetInfo::cw20(cash_addr.clone()).into(),
            )],
            800u128,
        );
        assert!(should_be_err.is_err());

        let should_be_err = exec_cw20_add_products(
            &mut app,
            &store_addr,
            &ohter_cw20,
            &buyer,
            to_be_updated_id,
            vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            800u128,
        );
        assert!(should_be_err.is_err());

        let should_be_err = exec_cw20_add_products(
            &mut app,
            &store_addr,
            &cash_addr,
            &buyer,
            to_be_updated_id,
            vec![(product_id, AssetInfo::cw20(ohter_cw20.clone()).into())],
            800u128,
        );
        assert!(should_be_err.is_err());

        let should_be_err = exec_cw20_add_products(
            &mut app,
            &store_addr,
            &cash_addr,
            &seller,
            to_be_updated_id,
            vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            800u128,
        );
        assert!(should_be_err.is_err());

        let should_be_ok = exec_cw20_add_products(
            &mut app,
            &store_addr,
            &cash_addr,
            &buyer,
            to_be_updated_id,
            vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            800u128,
        );
        assert!(should_be_ok.is_ok());

        let order = query_order(&app, &store_addr, to_be_updated_id)?;
        assert_eq!(order.status, OrderStatus::Creating);
        assert_eq!(order.products.len(), 2);
        assert_eq!(
            order.cart.find(&AssetInfo::cw20(cash_addr.clone())),
            Some(Asset::cw20(cash_addr.clone(), 1600u128)).as_ref()
        );

        let should_fail = exec_finalize(&mut app, &store_addr, &seller, order.id);
        assert!(should_fail.is_err());
        let b = query_user_stats(&app, &store_addr, &buyer)?;
        let s = query_user_stats(&app, &store_addr, &seller)?;
        assert_eq!(s.nb_orders, 2);
        assert_eq!(b.nb_orders, 2);

        let should_fail = exec_accept(&mut app, &store_addr, &seller, order.id);
        assert!(should_fail.is_err());

        let should_be_err = exec_reject(&mut app, &store_addr, &seller, to_be_updated_id);
        assert!(should_be_err.is_err());

        exec_finalize(&mut app, &store_addr, &buyer, order.id)?;

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        let s = query_user_stats(&app, &store_addr, &seller)?;
        assert_eq!(s.nb_orders, 3);
        assert_eq!(b.nb_orders, 3);

        let order = query_order(&app, &store_addr, to_be_updated_id)?;
        assert_eq!(order.status, OrderStatus::Pending);

        let should_fail = exec_accept(&mut app, &store_addr, &buyer, order.id);
        assert!(should_fail.is_err());

        exec_blacklist(&mut app, &store_addr, &admin, vec![buyer.to_string()])?;

        let should_fail = exec_accept(&mut app, &store_addr, &seller, order.id);
        assert!(should_fail.is_err());

        exec_unblacklist(&mut app, &store_addr, &admin, vec![buyer.to_string()])?;

        assert!(exec_fulfill(&mut app, &store_addr, &buyer, order.id).is_err());

        exec_accept(&mut app, &store_addr, &seller, order.id)?;

        let order = query_order(&app, &store_addr, to_be_updated_id)?;
        assert_eq!(order.status, OrderStatus::Accepted);

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        let s = query_user_stats(&app, &store_addr, &seller)?;

        assert_eq!(s.nb_orders, 3);
        assert_eq!(b.nb_orders, 3);

        let should_be_err = exec_finalize(&mut app, &store_addr, &buyer, order.id);

        assert!(should_be_err.is_err());

        let should_be_err = exec_reject(&mut app, &store_addr, &buyer, order.id);
        assert!(should_be_err.is_err());

        let should_be_err = exec_reject(&mut app, &store_addr, &admin, finalized_order_id);
        assert!(should_be_err.is_err());

        let should_be_ok = exec_reject(&mut app, &store_addr, &buyer, finalized_order_id);
        assert!(should_be_ok.is_ok());

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        assert_eq!(b.nb_rejected_orders, 1);

        let bnk = query_bank(&app, &store_addr)?;
        // there are 3 products created so far
        // 3*9 = 27
        // 0/3 = 0
        // 2/3 = 18
        // 1/3 = 9
        assert!(bnk.to_dev.is_empty());
        assert_eq!(
            bnk.to_investors.find(&AssetInfo::native("atom")),
            Some(&Asset::native("atom", 18u128))
        );
        assert_eq!(
            bnk.to_claim_reserve.find(&AssetInfo::native("atom")),
            Some(&Asset::native("atom", 9u128))
        );

        let prev_amount = query_balance_cw20(&app, &cash_addr, &seller);

        let bnk_amount_prev = query_balance_cw20(&app, &cash_addr, &store_addr).u128();
        assert!(exec_fulfill(&mut app, &store_addr, &seller, order.id).is_err());
        exec_fulfill(&mut app, &store_addr, &buyer, order.id)?;

        let bnk = query_bank(&app, &store_addr)?;
        // there are 3 products created so far
        // fee_distribution = 1/4, 1/4, 2/4
        // 1% of 1600 = 16
        // 3*9 = 27
        // 0/3 = 0 + 4
        // 2/3 = 18 + 4
        // 1/3 = 9 + 8
        assert_eq!(
            bnk.to_dev.find(&AssetInfo::cw20(cash_addr.clone())),
            Some(&Asset::cw20(cash_addr.clone(), 4u128))
        );
        assert_eq!(
            bnk.to_investors.find(&AssetInfo::cw20(cash_addr.clone())),
            Some(&Asset::cw20(cash_addr.clone(), 4u128))
        );
        assert_eq!(
            bnk.to_claim_reserve
                .find(&AssetInfo::cw20(cash_addr.clone())),
            Some(&Asset::cw20(cash_addr.clone(), 8u128))
        );

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        let s = query_user_stats(&app, &store_addr, &seller)?;

        assert_eq!(
            b.generated_fees,
            AssetList::from(vec![Asset::cw20(cash_addr.clone(), 8u128)])
        );
        assert_eq!(
            s.generated_fees,
            AssetList::from(vec![Asset::cw20(cash_addr.clone(), 8u128)])
        );

        assert_eq!(b.nb_fulfilled_orders, 1);
        assert_eq!(s.nb_fulfilled_orders, 1);

        let new_amount = query_balance_cw20(&app, &cash_addr, &seller);

        assert_eq!(new_amount.u128(), prev_amount.u128() + 1600 - 16);

        let ord = query_order(&app, &store_addr, order.id)?;
        assert_eq!(ord.status, OrderStatus::Fulfilled);

        let bnk_amount = query_balance_cw20(&app, &cash_addr, &store_addr).u128();

        assert_eq!(bnk_amount, bnk_amount_prev - 1600 + 16);

        assert_eq!(
            query_orders_for(&app, &store_addr, &buyer, None)?,
            (vec![], None)
        );

        let mut nxt = None;
        let (pts, next) = query_orders_for(&app, &store_addr, &seller, nxt)?;
        assert_eq!(pts.len(), 2);
        assert!(next.is_some());
        nxt = next;

        let (pts, next) = query_orders_for(&app, &store_addr, &seller, nxt)?;
        assert_eq!(pts.len(), 1);
        assert!(next.is_none());

        assert_eq!(
            query_orders_from(&app, &store_addr, &seller, None)?,
            (vec![], None)
        );

        let mut nxt = None;
        let (pts, next) = query_orders_from(&app, &store_addr, &buyer, nxt)?;
        assert_eq!(pts.len(), 2);
        assert!(next.is_some());
        nxt = next;

        let (pts, next) = query_orders_from(&app, &store_addr, &buyer, nxt)?;
        assert_eq!(pts.len(), 1);
        assert!(next.is_none());

        assert!(exec_cw20_invest(&mut app, &cash_addr, &store_addr, &admin, 1600).is_ok());
        let info = &AssetInfo::cw20(cash_addr.clone());

        let prev_bk = query_bank(&app, &store_addr)?;
        let prev_a_s = query_balance_cw20(&app, &cash_addr, &seller).u128();
        let prev_a_b = query_balance_cw20(&app, &cash_addr, &buyer).u128();
        let prev_bk_a = query_balance_cw20(&app, &cash_addr, &store_addr).u128();

        assert!(exec_dispute(&mut app, &store_addr, &seller, other_order_id).is_err());
        exec_accept(&mut app, &store_addr, &seller, other_order_id)?;
        assert!(exec_dispute(&mut app, &store_addr, &admin, other_order_id).is_err());
        exec_dispute(&mut app, &store_addr, &buyer, other_order_id)?;
        // check user stats
        // check the bank
        // check refunded amounts

        let stat_s = query_user_stats(&app, &store_addr, &seller)?;
        let stat_b = query_user_stats(&app, &store_addr, &buyer)?;
        let bk = query_bank(&app, &store_addr)?;
        let a_s = query_balance_cw20(&app, &cash_addr, &seller).u128();
        let a_b = query_balance_cw20(&app, &cash_addr, &buyer).u128();
        let bk_a = query_balance_cw20(&app, &cash_addr, &store_addr).u128();

        assert_eq!(
            stat_s.generated_fees.find(info).map(|e| e.amount.u128()),
            Some(8)
        );
        assert_eq!(
            stat_b.generated_fees.find(info).map(|e| e.amount.u128()),
            Some(8)
        );
        //             (order   - fee)*riskR + complement
        let v = (800u128 - 8u128) / 2u128 + 4u128;
        assert_eq!(prev_a_s + v, a_s);
        assert_eq!(prev_a_b + v, a_b);
        assert_eq!(
            bk.to_claim_reserve.find(info).unwrap().amount.u128(),
            //                                                        - complement + 2/4 of fee
            prev_bk.to_claim_reserve.find(info).unwrap().amount.u128() - 8 + 8 * 2 / 4
        );
        assert_eq!(
            bk.to_dev.find(info).unwrap().amount.u128(),
            //                                                1/4 of fee
            prev_bk.to_dev.find(info).unwrap().amount.u128() + 2,
        );

        assert_eq!(
            bk.to_investors.find(info).unwrap().amount.u128(),
            //                                                1/4 of fee
            prev_bk.to_investors.find(info).unwrap().amount.u128() + 2,
        );

        //                         -  price - complement_b - complement_s + fee
        assert_eq!(bk_a, prev_bk_a - 800u128 - 4 - 4 + 8);
        let to_investors = bk.to_investors.find(info).unwrap().amount.u128();

        assert!(exec_distribute(&mut app, &store_addr, &admin).is_err());
        assert!(exec_distribute(&mut app, &store_addr, &buyer).is_err());

        next_n_blocks(&mut app, Some(5)); // after

        assert!(exec_distribute(&mut app, &store_addr, &admin).is_ok());
        let bk = query_bank(&app, &store_addr)?;
        assert_eq!(bk.to_investors.find(info), None,);
        let prev_ia = query_balance_cw20(&app, &cash_addr, &admin).u128();
        exec_withdraw(&mut app, &store_addr, &admin)?;
        next_n_blocks(&mut app, Some(1)); // after distribution
        exec_withdraw(&mut app, &store_addr, &admin)?;

        let ia = query_balance_cw20(&app, &cash_addr, &admin).u128();
        assert_eq!(ia, prev_ia + to_investors);

        Ok(())
    }

    #[test]
    fn order_tests() -> Result<(), AnyError> {
        let admin = Addr::unchecked("admin");
        let buyer = Addr::unchecked("buyer");
        let seller = Addr::unchecked("seller");

        let (mut app, store_addr, _, _) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    admin.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![],
            None,
        )?;
        let valid_price = AssetList::from(vec![Asset::native("atom", 800u128)]);

        let product_id = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        )?;
        let product2_id = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            Some(WEEK * 2),
        )?;
        let mut msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![],
            ready: true,
        };
        assert!(exec_create_order(
            &mut app,
            &store_addr,
            &buyer,
            msg.clone(),
            coins(800u128, "atom")
        )
        .is_err());
        msg.cart = vec![(product_id, AssetInfo::native("atom").into())];

        assert!(exec_create_order(
            &mut app,
            &store_addr,
            &buyer,
            msg.clone(),
            coins(800u128, "atom")
        )
        .is_ok());

        msg.ready = false;
        let to_update = exec_create_order(
            &mut app,
            &store_addr,
            &buyer,
            msg.clone(),
            coins(800u128, "atom"),
        )?;

        let is_ok = exec_add_products(
            &mut app,
            &store_addr,
            &buyer,
            to_update,
            vec![(product_id, AssetInfo::native("atom").into())],
            coins(800u128, "atom"),
        );
        assert!(is_ok.is_ok());

        msg.ready = true;
        let seller_fulfills = exec_create_order(
            &mut app,
            &store_addr,
            &buyer,
            msg.clone(),
            coins(800u128, "atom"),
        )?;

        exec_accept(&mut app, &store_addr, &seller, seller_fulfills)?;

        assert!(exec_fulfill(&mut app, &store_addr, &seller, seller_fulfills).is_err());

        add_days(&mut app, Some(14));

        assert!(exec_fulfill(&mut app, &store_addr, &seller, seller_fulfills).is_ok());

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(product_id, AssetInfo::native("atom").into())],
            ready: false,
        };

        let id = exec_create_order(
            &mut app,
            &store_addr,
            &buyer,
            msg.clone(),
            coins(800u128, "atom"),
        )?;

        exec_add_products(
            &mut app,
            &store_addr,
            &buyer,
            id,
            vec![(product2_id, AssetInfo::native("atom").into())],
            coins(800u128, "atom"),
        )?;

        exec_finalize(&mut app, &store_addr, &buyer, id)?;

        exec_accept(&mut app, &store_addr, &seller, id)?;

        add_days(&mut app, Some(14));

        assert!(exec_fulfill(&mut app, &store_addr, &seller, id).is_err());

        add_days(&mut app, Some(7));

        assert!(exec_fulfill(&mut app, &store_addr, &seller, id).is_ok());

        Ok(())
    }
    ///////////////////////
    ///      Params     ///
    ///////////////////////
    #[test]
    fn params_test() -> Result<(), AnyError> {
        let admin = Addr::unchecked("admin");
        let buyer = Addr::unchecked("buyer");
        let seller = Addr::unchecked("seller");
        // cant blacklist if not admin

        let (mut app, store_addr, cash_addr, _) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            None,
        )?;
        let should_error = exec_blacklist(&mut app, &store_addr, &buyer, vec![seller.to_string()]);
        let params = query_params(&app, &store_addr);
        assert!(params.is_ok());
        assert!(should_error.is_err());
        let should_error = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            Some(InstantiateMsg {
                admin: admin.to_string(),
                fee_distribution: Distribution {
                    to_dev: (1, 5),
                    to_claim_reserve: (2, 6),
                    to_investors: (1, 1),
                },
                investment_distribution: Distribution {
                    to_dev: (1, 5),
                    to_claim_reserve: (2, 6),
                    to_investors: (1, 1),
                },
                fee: (1, 100),
                publication_fee: AssetListBase::new().into(),
                publication_fee_distribution: Distribution {
                    to_dev: (1, 5),
                    to_claim_reserve: (2, 6),
                    to_investors: (1, 1),
                },
                max_contract_risk_share: (1, 5),
                weighted_accepted_assets: vec![],
                unbounding_duration: Duration::Height(1),
                reward_rate: Duration::Height(2),
            }),
        );
        assert!(should_error.is_err());
        let should_error = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            Some(InstantiateMsg {
                admin: admin.to_string(),
                fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                investment_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                fee: (100, 0),
                publication_fee: AssetListBase::new().into(),
                publication_fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                max_contract_risk_share: (1, 5),
                weighted_accepted_assets: vec![],
                unbounding_duration: Duration::Height(1),
                reward_rate: Duration::Height(2),
            }),
        );
        assert!(should_error.is_err());
        let should_error = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            Some(InstantiateMsg {
                admin: admin.to_string(),
                fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                investment_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                fee: (1, 100),
                publication_fee: AssetListBase::new().into(),
                publication_fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                max_contract_risk_share: (1, 5),
                weighted_accepted_assets: vec![
                    (AssetInfoUnchecked::Cw20(cash_addr.to_string()), 1),
                    (AssetInfoUnchecked::Cw20(buyer.to_string()), 1),
                    (AssetInfoUnchecked::Cw20(cash_addr.to_string()), 1),
                ],
                unbounding_duration: Duration::Height(1),
                reward_rate: Duration::Height(2),
            }),
        );
        assert!(should_error.is_err());
        let should_error = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            Some(InstantiateMsg {
                admin: admin.to_string(),
                fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                investment_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                fee: (1, 100),
                publication_fee: AssetListBase::new().into(),
                publication_fee_distribution: Distribution {
                    to_dev: (1, 2),
                    to_claim_reserve: (1, 2),
                    to_investors: (0, 1),
                },
                max_contract_risk_share: (1, 0),
                weighted_accepted_assets: vec![],
                unbounding_duration: Duration::Height(1),
                reward_rate: Duration::Height(2),
            }),
        );
        assert!(should_error.is_err());

        let info = query_info(&app, &store_addr)?;
        assert_eq!(info.info.contract, "crates.io:crzx-store");

        Ok(())
    }

    ///////////////////////
    ///      Params     ///
    ///////////////////////
    #[test]
    fn review_test() -> Result<(), AnyError> {
        let admin = Addr::unchecked("admin");
        let buyer = Addr::unchecked("buyer");
        let seller = Addr::unchecked("seller");

        let (mut app, store_addr, cash_addr, _) = init_app(
            &admin,
            vec![
                (
                    buyer.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    seller.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
                (
                    admin.clone(),
                    vec![Coin {
                        denom: "atom".to_string(),
                        amount: Uint128::new(5000),
                    }],
                ),
            ],
            vec![
                Cw20Coin {
                    address: buyer.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: seller.to_string(),
                    amount: Uint128::new(5000),
                },
                Cw20Coin {
                    address: admin.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
            None,
        )?;

        let valid_price = AssetList::from(vec![Asset::cw20(cash_addr.clone(), 800u128)]);

        let product_id = exec_create_product(
            &mut app,
            &store_addr,
            &seller,
            valid_price.clone().into(),
            true,
            "".to_string(),
            Some(coins(9, "atom")),
            None,
        )?;

        let msg = CreateOrderExecuteMsg {
            seller: seller.to_string(),
            buyer_risk_share: (1, 2),
            cart: vec![(product_id, AssetInfo::cw20(cash_addr.clone()).into())],
            ready: true,
        };
        let order_id =
            exec_cw20_create_order(&mut app, &cash_addr, &store_addr, &buyer, msg, 800u128)?;

        let mut msg = ReviewProductExecuteMsg {
            order_id,
            product_id: 1,
            rating: 4,
            message: "".to_string(),
        };
        assert!(exec_review_product(&mut app, &store_addr, &buyer, msg.clone()).is_err());

        assert!(exec_review_user(
            &mut app,
            &store_addr,
            &buyer,
            ReviewUserExecuteMsg {
                order_id,
                rating: 5,
                message: "".to_string(),
            }
        )
        .is_err());

        exec_accept(&mut app, &store_addr, &seller, order_id)?;
        exec_fulfill(&mut app, &store_addr, &buyer, order_id)?;
        assert!(exec_review_user(
            &mut app,
            &store_addr,
            &admin,
            ReviewUserExecuteMsg {
                order_id,
                rating: 5,
                message: "".to_string(),
            }
        )
        .is_err());
        assert!(exec_review_user(
            &mut app,
            &store_addr,
            &buyer,
            ReviewUserExecuteMsg {
                order_id: 404,
                rating: 5,
                message: "".to_string(),
            }
        )
        .is_err());
        assert!(exec_review_user(
            &mut app,
            &store_addr,
            &buyer,
            ReviewUserExecuteMsg {
                order_id,
                rating: 5,
                message: "".to_string(),
            }
        )
        .is_ok());

        assert!(exec_review_user(
            &mut app,
            &store_addr,
            &seller,
            ReviewUserExecuteMsg {
                order_id,
                rating: 4,
                message: "".to_string(),
            }
        )
        .is_ok());

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        let s = query_user_stats(&app, &store_addr, &seller)?;

        assert_eq!(b.rating, (4, 1));
        assert_eq!(s.rating, (5, 1));

        let reviews = query_reviews_from(&mut app, &store_addr, &buyer, None)?;
        assert_eq!(reviews.0.len(), 1);
        assert_eq!(reviews.1, None);
        assert_eq!(reviews.0[0].rating, 5);
        assert_eq!(reviews.0[0].from, buyer.clone());
        assert_eq!(reviews.0[0].of, ReviewOf::User(seller.clone()));

        let reviews = query_reviews_from(&mut app, &store_addr, &seller, None)?;
        assert_eq!(reviews.0.len(), 1);
        assert_eq!(reviews.1, None);
        assert_eq!(reviews.0[0].rating, 4);
        assert_eq!(reviews.0[0].from, seller.clone());
        assert_eq!(reviews.0[0].of, ReviewOf::User(buyer.clone()));

        let reviews_of_seller = query_reviews_of(&mut app, &store_addr, &seller, None)?;
        assert_eq!(reviews_of_seller.0.len(), 1);
        assert_eq!(reviews_of_seller.1, None);
        assert_eq!(reviews_of_seller.0[0].rating, 5);
        assert_eq!(reviews_of_seller.0[0].from, buyer.clone());
        assert_eq!(reviews_of_seller.0[0].of, ReviewOf::User(seller.clone()));

        assert!(exec_review_user(
            &mut app,
            &store_addr,
            &seller,
            ReviewUserExecuteMsg {
                order_id,
                rating: 3,
                message: "".to_string(),
            }
        )
        .is_ok());

        let reviews_of_buyer = query_reviews_of(&mut app, &store_addr, &buyer, None)?;
        assert_eq!(reviews_of_buyer.0.len(), 1);
        assert_eq!(reviews_of_buyer.1, None);
        assert_eq!(reviews_of_buyer.0[0].rating, 3);
        assert_eq!(reviews_of_buyer.0[0].from, seller.clone());

        let b = query_user_stats(&app, &store_addr, &buyer)?;
        assert_eq!(b.rating, (3, 1));

        assert!(exec_review_product(&mut app, &store_addr, &seller, msg.clone()).is_err());
        msg.rating = 12;
        assert!(exec_review_product(&mut app, &store_addr, &buyer, msg.clone()).is_err());

        msg.rating = 2;
        msg.product_id = 2;
        assert!(exec_review_product(&mut app, &store_addr, &buyer, msg.clone()).is_err());

        msg.product_id = 1;
        msg.message = "a".repeat(123456);
        assert!(exec_review_product(&mut app, &store_addr, &buyer, msg.clone()).is_err());

        msg.message = "a".to_string();
        msg.product_id = 1;
        assert!(exec_review_product(&mut app, &store_addr, &buyer, msg.clone()).is_ok());
        let r = query_reviews_of_product(&mut app, &store_addr, product_id, None)?;
        assert_eq!(r.0.len(), 1);
        assert_eq!(r.1, None);
        assert_eq!(r.0[0].rating, 2);

        msg.rating = 4;
        assert!(exec_review_product(&mut app, &store_addr, &buyer, msg.clone()).is_ok());

        let r = query_reviews_of_product(&mut app, &store_addr, product_id, None)?;
        assert_eq!(r.0.len(), 1);
        assert_eq!(r.1, None);
        assert_eq!(r.0[0].rating, 4);

        Ok(())
    }
}

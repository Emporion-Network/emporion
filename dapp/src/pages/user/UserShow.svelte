<script lang="ts">
    import InvestModal from "./components/InvestModal.svelte";
    import Menu from "../../lib/Menu.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import Stars from "../../lib/Stars.svelte";
    import Table from "../../lib/Table.svelte";
    import { prices } from "../../stores/coins";
    import { clients } from "../../stores/readStores";
    import { api, user } from "../../stores/user";
    import {
        dateToString,
        getExpirationDate,
        getOnChainDenom,
        rotateObj,
    } from "../../utils";
    import BuyerOrdersTable from "./components/BuyerOrdersTable.svelte";
    import SellerOrdersTable from "./components/SellerOrdersTable.svelte";
    import { Decimal } from "@cosmjs/math";
    import type { Review } from "../../../../client-ts/Emporion.client";

    const getRevewFor = async (addr:string, id:number)=>{
        let reviews = (await $user?.emporionClient.reviews_of_reviewed({
            addr: addr,
            start_from: id,
        }));
        return reviews?.[0][0] || {} as Review;
    }

    const fetchData = async (_?: any) => {
        const ordersFrom = await $user!.emporionClient.orders_from_buyer({
            addr: $user!.address,
        });
        const ordersFor = await $user!.emporionClient.orders_for_seller({
            addr: $user!.address,
        });
        const ordersFromMeta = Promise.all(
            ordersFrom[0].map(async (o) => {
                return {
                    order: o,
                    metaData: await api.orderMetaDataGet(o.id.toString()),
                    review: await getRevewFor(o.seller, o.id)
                };
            }),
        );
        const ordersForMeta = Promise.all(
            ordersFor[0].map(async (o) => {
                return {
                    order: o,
                    metaData: await api.orderMetaDataGet(o.id.toString()),
                    review: await getRevewFor(o.buyer, o.id),
                };
            }),
        );
        return {
            ordersFrom: (await ordersFromMeta),
            ordersFor: (await ordersForMeta),
        };
    };
    let r = rotateObj($prices, "onChainDenom");
    let showModal = false;
    let side: "invest" | "divest" = "invest";
    const openInvest = () => {
        side = "invest";
        showModal = true;
    };

    const openDinvest = () => {
        side = "divest";
        showModal = true;
    };

    const claim = async (e:MouseEvent)=>{
        await $user?.emporionClient.withdraw({}, 'auto')
    }

    const getData = (usr: any) => {
        return $clients.emporionQueryClient
            .user_stats({ addr: $user!.address })
            .catch((e) => ({
                generated_fees: [],
                unbonding: [],
                invested: [],
                addr: $user!.address,
                rating: [0, 0] as [number, number],
                nb_disputed_orders: 0,
                nb_orders: 0,
                nb_fulfilled_orders: 0,
                nb_rejected_orders: 0,
            }));
    };

    let data = getData($user);
    $: data = getData($user);
</script>

<Menu>
    <SearchBar></SearchBar>
</Menu>

<div class="page">
    {#await data then userStats}
        <div class="user-info">
            <div>
                <h2>User info</h2>
                <div class="line">
                    <div><i class="ri-hashtag"></i> Address:</div>
                    <div>{userStats.addr}</div>
                </div>
                <div class="line">
                    <div><i class="ri-star-line"></i> Rating:</div>
                    <div><Stars rating={userStats.rating}></Stars></div>
                </div>
                <div class="line">
                    <div><i class="ri-auction-line"></i> Disputed orders</div>
                    <div>
                        {userStats.nb_disputed_orders}/{userStats.nb_orders}
                    </div>
                </div>
                <div class="line">
                    <div><i class="ri-medal-line"></i> Filfilled orders</div>
                    <div>
                        {userStats.nb_fulfilled_orders}/{userStats.nb_orders}
                    </div>
                </div>
                <div class="line">
                    <div>
                        <i class="ri-prohibited-line"></i> Rejected orders
                    </div>
                    <div>
                        {userStats.nb_rejected_orders}/{userStats.nb_orders}
                    </div>
                </div>
                <div class="line">
                    <div><i class="ri-stack-line"></i> Total orders</div>
                    <div>{userStats.nb_orders}</div>
                </div>
            </div>
            <div>
                <h2>Generated Fees</h2>
                <Table rows={userStats.generated_fees} index="info">
                    <svelte:fragment slot="head">
                        <div>Coin</div>
                        <div>Amount</div>
                    </svelte:fragment>
                    <svelte:fragment slot="item" let:item>
                        {@const coinInfo = r[getOnChainDenom(item.info)]}
                        <div>{coinInfo.coinDenom}</div>
                        <div>
                            {Decimal.fromAtomics(
                                item.amount,
                                coinInfo.coinDecimals,
                            ).toString()}
                        </div>
                    </svelte:fragment>
                </Table>
                <h2>Unbounding assets</h2>
                <Table rows={userStats.unbonding} index="0">
                    <svelte:fragment slot="head">
                        <div>Coin</div>
                        <div>Amount</div>
                        <div>Expiration</div>
                    </svelte:fragment>
                    <svelte:fragment slot="item" let:item>
                        {@const coinInfo = r[getOnChainDenom(item[0].info)]}
                        {@const expirationDate = getExpirationDate(item[1])}
                        <div>{coinInfo.coinDenom}</div>
                        <div>
                            {Decimal.fromAtomics(
                                item[0].amount,
                                coinInfo.coinDecimals,
                            ).toString()}
                        </div>
                        {#if expirationDate.getTime() > Date.now()}
                            <div>{dateToString(expirationDate)}</div>
                        {:else}
                            <div>Available</div>
                        {/if}
                    </svelte:fragment>
                </Table>
                <h2>Invested</h2>
                <Table rows={userStats.invested} index="info">
                    <svelte:fragment slot="head">
                        <div>Coin</div>
                        <div>Amount</div>
                    </svelte:fragment>
                    <svelte:fragment slot="item" let:item>
                        {@const coinInfo = r[getOnChainDenom(item.info)]}
                        <div>{coinInfo.coinDenom}</div>
                        <div>
                            {Decimal.fromAtomics(
                                item.amount,
                                coinInfo.coinDecimals,
                            ).toString()}
                        </div>
                    </svelte:fragment>
                </Table>
                <div class="buttons">
                    <button on:click={openInvest} class="button-1">
                        Invest
                    </button>
                    <button on:click={openDinvest} class="button-2">
                        Divest
                    </button>
                    <button class="button-2" on:click={claim} disabled={!userStats.unbonding.find(e => getExpirationDate(e[1]).getTime() < Date.now())}>
                        Claim All
                    </button>
                </div>
            </div>
        </div>
        {#await fetchData($user) then { ordersFrom, ordersFor }}
            {#if ordersFor.length}
                <h2>Incoming Orders</h2>
                <SellerOrdersTable items={ordersFor}></SellerOrdersTable>
            {/if}
            <h2>Outgoing Orders</h2>
            <BuyerOrdersTable items={ordersFrom}></BuyerOrdersTable>
        {/await}
        <InvestModal {side} bind:isVisible={showModal} invested={userStats.invested}></InvestModal>
    {/await}
</div>

<style lang="scss">
    @use "../../media.scss";
    .page {
        display: flex;
        flex-direction: column;
        margin: 0 5%;
        gap: 1rem;
        .user-info {
            color: var(--gray-12);
            display: flex;
            gap: 3rem;
            .buttons {
                display: flex;
                gap: 1rem;
            }
            & > div {
                display: flex;
                flex-direction: column;
                flex: 1;
                .line {
                    align-items: center;
                    justify-content: space-between;
                    display: flex;
                    border-bottom: 1px solid var(--gray-6);
                    height: 3rem;
                    div:first-of-type {
                        display: flex;
                        font-weight: bold;
                        i {
                            font-weight: 100;
                            margin-right: 0.5rem;
                        }
                    }
                }
            }
            & > div:nth-of-type(2) {
                gap: 1rem;
            }
        }

        h2 {
            color: var(--gray-12);
        }
    }
</style>

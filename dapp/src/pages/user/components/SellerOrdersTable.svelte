<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";
    import Table from "../../../lib/Table.svelte";
    import Select from "../../../lib/Select.svelte";
    import type {
        Expiration,
        Order,
        Review,
        Timestamp,
    } from "../../../../../client-ts/Emporion.client";
    import { prices } from "../../../stores/coins";
    import {
        capitalize,
        dateToString,
        getExpirationDate,
        getOnChainDenom,
        rotateObj,
        type FlattenObject,
    } from "../../../utils";
    import { Decimal } from "@cosmjs/math";
    import type { OrderMetaData } from "../../../../../shared-types";
    import OverflowAddress from "../../../lib/OverflowAddress.svelte";
    import CartProducts from "./CartProducts.svelte";
    import ConfirmationModal from "../../../lib/ConfirmationModal.svelte";
    import { api, user } from "../../../stores/user";
    import Description from "../../../lib/Description.svelte";
    import Rate from "../../../lib/Rate.svelte";
    import LoaderButton from "../../../lib/LoaderButton.svelte";
    import { goTo, href } from "../../../stores/location";
    let r = rotateObj($prices, "onChainDenom");
    let alert = async (msg: string, yes?: string, no?: string) => false;
    export let items: {
        order: Order;
        metaData: OrderMetaData;
        checked?: boolean;
        isOpen?: boolean;
        review: Review;
    }[] = [];

    const getTotalUSD = (total: Order["total"], _?: any) => {
        return total.reduce((acc, c) => {
            const denom = getOnChainDenom(c.info);
            const data = r[denom];
            const price = data.price.toFloatApproximation();
            const total =
                Decimal.fromAtomics(
                    c.amount,
                    data.coinDecimals,
                ).toFloatApproximation() * price;
            return acc + total;
        }, 0);
    };

    type Keys<T> = keyof FlattenObject<T>;

    const get = <T,>(obj: T, k: Keys<T> & string) => {
        return k.split(".").reduce((acc, k) => {
            return acc[k as keyof typeof acc] as any;
        }, obj) as FlattenObject<T>[typeof k];
    };

    const sortByString =
        (key: Keys<(typeof items)[number]>) =>
        (a: (typeof items)[number], b: (typeof items)[number]) => {
            return get(a, key)
                ?.toString()
                .localeCompare(get(b, key)!.toString())!;
        };
    const sortByNum =
        (key: Keys<(typeof items)[number]>) =>
        (a: (typeof items)[number], b: (typeof items)[number]) => {
            return Number(get(a, key)) - Number(get(b, key));
        };
    const sortByPrice = (
        a: (typeof items)[number],
        b: (typeof items)[number],
    ) => {
        return getTotalUSD(a.order.total) - getTotalUSD(b.order.total);
    };
    const sortByBuyer = sortByString("order.buyer");
    const sortByDeliveryDate = sortByNum("order.expected_delivery.at_time");
    const sortByCreationDate = sortByNum("order.created_at");

    const getDeliveryDate = (expiration: Expiration) => {
        if ("at_time" in expiration) {
            const date = new Date(Number(expiration.at_time.slice(0, 13)));
            return dateToString(date);
        }
        return "";
    };

    const getCreationDate = (timestamp: Timestamp) => {
        const date = new Date();
        date.setTime(Number(timestamp) / 1000000);
        return dateToString(date);
    };

    const checkItem: (
        item: (typeof items)[number],
    ) => ChangeEventHandler<HTMLInputElement> = (item) => (e) => {
        let i = items.find((i) => i == item)!;
        i.checked = e.currentTarget.checked;
        items = items;
    };

    const expandItem = (item: (typeof items)[number]) => () => {
        let i = items.find((i) => i == item)!;
        i.isOpen = !i.isOpen;
        items = items;
    };

    const selectAll: ChangeEventHandler<HTMLInputElement> = (e) => {
        items.forEach((i) => {
            i.checked = e.currentTarget.checked;
        });
        items = items;
    };

    const icon = {
        "0": "ri-expand-up-down-line",
        undefined: "ri-expand-up-down-line",
        "1": "ri-arrow-up-s-line",
        "-1": "ri-arrow-down-s-line",
    } as { [key: string]: string };
    const statusFilters = {
        all: (_: (typeof items)[number]) => true,
        pending: (t: (typeof items)[number]) => t.order.status === "pending",
        accepted: (t: (typeof items)[number]) => t.order.status === "accepted",
        rejected: (t: (typeof items)[number]) => t.order.status === "rejected",
    };

    let filter = statusFilters["all"];
    const cancelOrder = (id: number) => async () => {
        if (await alert("Are you sure you want to cancel this order")) {
            await $user!.emporionClient.reject_order({ order_id: id }, "auto");
            items.find((i) => i.order.id === id)!.order.status = "rejected";
            items = items;
        }
    };

    const acceptOrder = (id: number) => async () => {
        await $user!.emporionClient.accept_order({ order_id: id }, "auto");
        items.find((i) => i.order.id === id)!.order.status = "accepted";
        items = items;
    };

    const fulfillOrder = (id: number) => async () => {
        await $user!.emporionClient.fulfill_order({ order_id: id }, "auto");
        items.find((i) => i.order.id === id)!.order.status = "fulfilled";
        items = items;
    };

    const setTrackingNb = (id: number) => async (e: any) => {
        await api.orderMetaDataTrackingNumberSet(e.target.value, id.toString());
    };

    const rate = (item: (typeof items)[number]) => async () => {
        await $user?.emporionClient.review_user(
            {
                order_id: item.order.id,
                rating: item.review.rating,
                message: item.review.message,
            },
            "auto",
        );
    };

    const createUrl = (orderId:number)=>{
        const url =  new URL($href.href);
        url.pathname = '/messages'
        url.search = '';
        url.searchParams.set('order_id', orderId.toString())
        return url.href;
    }
</script>

<div>
    <Table index="order" rows={items} bind:filter>
        <svelte:fragment slot="head" let:sort let:sorts>
            <div class="small"></div>
            <div class="small">
                <input type="checkbox" on:change={selectAll} />
            </div>
            <button on:click={() => sort(sortByBuyer)}>
                <i class={icon[`${sorts.get(sortByBuyer)}`]}></i>
                Buyer
            </button>
            <button on:click={() => sort(sortByCreationDate)}>
                <i class={icon[`${sorts.get(sortByCreationDate)}`]}></i>
                Creation date
            </button>
            <button on:click={() => sort(sortByDeliveryDate)}>
                <i class={icon[`${sorts.get(sortByDeliveryDate)}`]}></i>
                Delivery date
            </button>
            <button on:click={() => sort(sortByPrice)}>
                <i class={icon[`${sorts.get(sortByPrice)}`]}></i>
                Total
            </button>
            <button> Tracking number </button>
            <Select bind:selected={filter}>
                <svelte:fragment slot="selected" let:selected>
                    {capitalize(
                        Object.entries(statusFilters).find(
                            ([k, v]) => v === selected,
                        )?.[0] || "",
                    )}
                </svelte:fragment>
                <svelte:fragment slot="options" let:select>
                    <button on:click={select(statusFilters["pending"])}
                        >Pending</button
                    >
                    <button on:click={select(statusFilters["accepted"])}
                        >Accepted</button
                    >
                    <button on:click={select(statusFilters["rejected"])}
                        >Rejected</button
                    >
                    <button on:click={select(statusFilters["all"])}>All</button>
                </svelte:fragment>
            </Select>
        </svelte:fragment>
        <svelte:fragment slot="item" let:item>
            {#if !item.isOpen}
                <div class="small">
                    <button on:click={expandItem(item)}
                        ><i class="ri-arrow-down-s-line"></i></button
                    >
                </div>
                <div class="small">
                    <input
                        type="checkbox"
                        on:change={checkItem(item)}
                        checked={item.checked}
                    />
                </div>
                <div><OverflowAddress address={item.order.buyer} /></div>
                <div>{getCreationDate(item.order.created_at)}</div>
                <div>{getDeliveryDate(item.order.expected_delivery)}</div>
                <div>${getTotalUSD(item.order.total, $prices).toFixed(2)}</div>
                <div class="tracking-nb">
                    <i class="ri-pencil-line"></i>
                    <input
                        class="tracking-nb"
                        value={item.metaData?.trackingNumber ||
                            "No tracking number"}
                        on:change={setTrackingNb(item.order.id)}
                    />
                </div>
                <div>
                    <span class="tag {item.order.status}"
                        >{item.order.status}</span
                    >
                </div>
            {/if}
            {#if !!item.isOpen}
                <div class="row-container">
                    <div>
                        <button on:click={expandItem(item)}>
                            <i class="ri-arrow-up-s-line"></i>
                        </button>
                    </div>
                    <div class="expended-content">
                        <div class="cart">
                            <h2>Cart</h2>
                            <CartProducts orderId={item.order.id} cart={item.order.cart}></CartProducts>
                        </div>
                        <div class="details">
                            <h2>
                                Details <span class="tag {item.order.status}"
                                    >{item.order.status}</span
                                >
                            </h2>
                            <div>
                                <span
                                    ><i class="ri-store-2-line"></i>Seller</span
                                >
                                <span
                                    ><OverflowAddress
                                        address={item.order.seller}
                                    ></OverflowAddress></span
                                >
                            </div>
                            <div>
                                <span
                                    ><i class="ri-barcode-line"></i>Tracking
                                    number</span
                                >
                                <span
                                    >{item.metaData?.trackingNumber ||
                                        "No tracking number"}</span
                                >
                            </div>
                            <div class="deliveryAddress">
                                <span
                                    ><i class="ri-map-pin-line"
                                    ></i>Address</span
                                >
                                <div class="content">
                                    {item.metaData?.postalAddress}
                                </div>
                            </div>
                            <div>
                                <span
                                    ><i class="ri-calendar-2-line"></i>Created
                                    on</span
                                >
                                <span
                                    >{getCreationDate(
                                        item.order.created_at,
                                    )}</span
                                >
                            </div>
                            <div>
                                <span
                                    ><i class="ri-calendar-2-line"></i>Expected
                                    delivery</span
                                >
                                <span
                                    >{getDeliveryDate(
                                        item.order.expected_delivery,
                                    )}</span
                                >
                            </div>
                            <div>
                                <span
                                    ><i class="ri-percent-line"></i>Risk ratio</span
                                >
                                <span
                                    >{(
                                        (100 * item.order.buyer_risk_share[0]) /
                                        item.order.buyer_risk_share[1]
                                    ).toFixed(2)}%</span
                                >
                            </div>
                            <div>
                                <span
                                    ><i class="ri-money-dollar-circle-line"
                                    ></i>Total</span
                                >
                                <span
                                    >${getTotalUSD(
                                        item.order.total,
                                        $prices,
                                    ).toFixed(2)}</span
                                >
                            </div>
                            {#if ["fulfilled", "disputed"].includes(item.order.status)}
                                {@const i = items.indexOf(item)}
                                <div class="rate">
                                    <span
                                        ><i class="ri-star-line"></i>Review user</span
                                    >
                                    <div>
                                        <Rate
                                            bind:rating={items[i].review.rating}
                                        />
                                        <Description
                                            rows={3}
                                            placeholder="Review message"
                                            bind:value={items[i].review.message}
                                        />
                                        <LoaderButton
                                            class="button-1"
                                            onClick={rate(item)}
                                            >Submit review</LoaderButton
                                        >
                                    </div>
                                </div>
                            {/if}
                            <div class="buttons">
                                {#if ["pending"].includes(item.order.status)}
                                    <button
                                        on:click={cancelOrder(item.order.id)}
                                        class="cancel button-1"
                                        >Cancel order</button
                                    >
                                    <button
                                        on:click={acceptOrder(item.order.id)}
                                        class="fulfill button-1"
                                        >Accept order</button
                                    >
                                {/if}
                                {#if ["accepted"].includes(item.order.status)}
                                    <button class="dispute button-1"
                                        >Dispute</button
                                    >
                                {/if}
                                {#if item.order.status === "accepted" && getExpirationDate(item.order.expected_delivery).getTime() < Date.now()}
                                    <button
                                        class="fulfill button-1"
                                        on:click={fulfillOrder(item.order.id)}
                                        >Reciecved</button
                                    >
                                {/if}
                                <button class="button-1 contact" on:click={goTo(createUrl(item.order.id))}>
                                    <i class="ri-question-answer-fill"></i>
                                    Contact Buyer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </svelte:fragment>
    </Table>
</div>

<ConfirmationModal bind:alert></ConfirmationModal>

<style lang="scss">
    div {
        .small {
            max-width: 70px !important;
            min-width: 70px !important;
        }
        .tag {
            padding: 0rem 0.7rem;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            border-radius: 3px;
            font-size: 0.9rem;
            padding-bottom: 0.2rem;
            font-weight: 600;
            &.pending {
                background-color: var(--yellow-a3);

                color: var(--yellow-11);
            }
            &.creating {
                background-color: var(--sky-a2);

                color: var(--sky-11);
            }
            &.accepted {
                background-color: var(--teal-a2);
                color: var(--teal-11);
            }
            &.rejected {
                background-color: var(--orange-a2);
                color: var(--orange-11);
            }
            &.fulfilled {
                background-color: var(--green-a2);
                color: var(--green-11);
            }
            &.disputed {
                background-color: var(--red-a2);
                color: var(--red-11);
            }
        }
        button {
            background-color: transparent;
            border: none;
            color: var(--gray-12);
            cursor: pointer;
        }
        .deliveryAddress {
            .content {
                color: var(--gray-12);
                white-space: pre;
            }
        }
        :global(.expended-content > div) {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .tracking-nb {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            input {
                background-color: transparent;
                border: none;
                color: var(--gray-12);
                border-radius: 3px;
                outline: none;
            }
        }
        .row-container {
            display: flex;
            flex-direction: column;
            & > div:first-of-type {
                display: flex;
                width: 100%;
                padding-top: 1rem;
                button {
                    width: 70px;
                }
            }

            .expended-content {
                display: flex;
                justify-content: space-between;
                width: 100%;
                padding: 1rem;
                gap: 3rem;
                :global(.overflow-address) {
                    max-width: 300px;
                }
                h2 {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .rate {
                    gap: 3rem;
                    div {
                        flex: 1;
                    }
                }
                .cart {
                    gap: 1rem;
                }
                .details {
                    & > div {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        border-bottom: 1px solid var(--gray-6);
                        padding: 0.5rem 0;
                        &:last-of-type {
                            border-bottom: none;
                        }
                        & > span:first-of-type {
                            font-weight: bold;
                            i {
                                margin-right: 0.5rem;
                                font-weight: 100;
                            }
                        }
                    }
                    .buttons {
                        display: flex;
                        justify-content: flex-start;
                        gap: 1rem;
                        .cancel {
                            background-color: var(--orange-2);
                            border: 1px solid var(--orange-6);
                            color: var(--orange-11);
                            &:hover {
                                border: 1px solid var(--orange-7);
                            }
                        }
                        .dispute {
                            background-color: var(--red-2);
                            border: 1px solid var(--red-6);
                            color: var(--red-11);
                            &:hover {
                                border: 1px solid var(--red-7);
                            }
                        }
                        .fulfill {
                            background-color: var(--green-2);
                            border: 1px solid var(--green-6);
                            color: var(--green-11);
                            &:hover {
                                border: 1px solid var(--green-7);
                            }
                        }
                        .contact {
                            border: 1px solid var(--gray-6);
                            &:hover {
                                border: 1px solid var(--gray-7);
                            }
                        }
                    }
                }
            }
        }
        :global(.option .selected) {
            flex: 1;
            border: none !important;
            justify-content: center !important;
        }
        :global(.options button) {
            height: 3rem;
            text-align: start;
            padding-left: 0.5rem;
            background-color: var(--gray-4);
            &:hover {
                background-color: var(--gray-5);
            }
        }
        :global(.option .selected i) {
            margin-left: 1rem !important;
        }
        :global(.head) {
            border-bottom: 1px solid var(--gray-6);
            background-color: var(--gray-2);
            border-radius: 3px 3px 0 0;
            border-top: 1px solid var(--gray-6);
        }
        :global(.table > .body > .row) {
            border-bottom: 1px solid var(--gray-6);
            min-height: 3rem;
            &:last-of-type {
                border-radius: 3px;
            }
        }
        :global(.table) {
            border-left: 1px solid var(--gray-6);
            border-right: 1px solid var(--gray-6);
            border-radius: 3px;
        }
    }
</style>

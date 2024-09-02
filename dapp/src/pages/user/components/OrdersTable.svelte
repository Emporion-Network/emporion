<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";
    import Table from "../../../lib/Table.svelte";
    import Select from "../../../lib/Select.svelte";
    import type {
        Expiration,
        Order,
        Timestamp,
    } from "../../../../../client-ts/Emporion.client";
    import { prices } from "../../../stores/coins";
    import {
        dateToString,
        getOnChainDenom,
        rotateObj,
        type FlattenObject,
    } from "../../../utils";
    import { Decimal } from "@cosmjs/math";
    import type { OrderMetaData } from "../../../../../shared-types";
    import OverflowAddress from "../../../lib/OverflowAddress.svelte";
    let r = rotateObj($prices, "onChainDenom");
    export let items: {
        order: Order;
        metaData: OrderMetaData;
        checked?: boolean;
    }[] = [];

    const getTotalUSD = (total: Order["total"], _?:any) => {
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
    const sortByPrice =  (a: (typeof items)[number], b: (typeof items)[number]) => {
        return getTotalUSD(a.order.total) - getTotalUSD(b.order.total)
    }
    const sortBySeller = sortByString("order.seller");
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
        date.setTime(Number(timestamp) / 100000);
        return dateToString(date);
    };

    const checkItem: (
        item: (typeof items)[number],
    ) => ChangeEventHandler<HTMLInputElement> = (item) => (e) => {
        let i = items.find((i) => i == item)!;
        i.checked = e.currentTarget.checked;
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
</script>

<div>
    <Table index="order" rows={items} bind:filter>
        <svelte:fragment slot="head" let:sort let:sorts>
            <div class="small">
                <input type="checkbox" on:change={selectAll} />
            </div>
            <button on:click={() => sort(sortBySeller)}>
                <i class={icon[`${sorts.get(sortBySeller)}`]}></i>
                Seller
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
            <button>
                Tracking number
            </button>
            <Select bind:selected={filter}>
                <svelte:fragment slot="selected" let:selected>
                    {Object.entries(statusFilters).find(
                        ([k, v]) => v === selected,
                    )?.[0]}
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
            <div class="small">
                <input
                    type="checkbox"
                    on:change={checkItem(item)}
                    checked={item.checked}
                />
            </div>
            <div><OverflowAddress address={item.order.seller} /></div>
            <div>{getCreationDate(item.order.created_at)}</div>
            <div>{getDeliveryDate(item.order.expected_delivery)}</div>
            <div>${getTotalUSD(item.order.total, $prices)}</div>
            <div>{item.metaData?.trackingNumber || 'No tracking number'}</div>
            <div><span class="tag {item.order.status}">{item.order.status}</span></div>
        </svelte:fragment>
    </Table>
</div>


<style lang="scss">
   div{
    .small {
        max-width: 70px !important;
        min-width: 70px !important;
    }
    .tag{
        &.pending{
            background-color: var(--yellow-a2);
            border: 1px solid var(--yellow-7);
            color: var(--yellow-11);
        }
        &.creating{
            background-color: var(--sky-a2);
            border: 1px solid var(--sky-7);
            color: var(--sky-11);
        }
        &.accepted{
            background-color: var(--teal-a2);
            border: 1px solid var(--teal-7);
            color: var(--teal-11);
        }
        &.rejected{
            background-color: var(--orange-a2);
            border: 1px solid var(--orange-7);
            color: var(--orange-11);
        }
        &.fulfilled{
            background-color: var(--green-a2);
            border: 1px solid var(--green-7);
            color: var(--green-11);
        }
        &.disputed{
            background-color: var(--red-a2);
            border: 1px solid var(--red-7);
            color: var(--red-11);
        }

        
        
        padding: 0rem 0.7rem;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 3px;
        font-size: 0.9rem;
        padding-bottom: 0.2rem;
    }
    button{
        background-color: transparent;
        border: none;
        color: var(--gray-12);
        cursor: pointer;
    }
    :global(.option .selected){
        flex:1;
        border: none !important;
        justify-content: center !important;
    }
    :global(.option .selected i){
        margin-left: 1rem !important;
    }
    :global(.head){
        border-bottom: 1px solid var(--gray-6);
        background-color: var(--gray-2);
        border-radius: 3px 3px 0 0;
        border-top: 1px solid var(--gray-6);
    }
    :global(.row){
        border-bottom: 1px solid var(--gray-6);
        height: 3rem;
        &:last-of-type{
            border-radius: 3px;
        }
    }
    :global(.table){
        border-left: 1px solid var(--gray-6);
        border-right: 1px solid var(--gray-6);
        border-radius: 3px;
    }
   }
</style>

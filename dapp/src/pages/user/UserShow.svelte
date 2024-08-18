<script lang="ts">
    import type { Expiration } from "../../../../client-ts/Emporion.client";
    import Menu from "../../lib/Menu.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import { rotateObj } from "../../utils";
    import { prices } from "../../stores/coins";
    import { user } from "../../stores/user";

    let r = rotateObj($prices, "onChainDenom");

    const fetchData = async (_?:any) => {
        const ordersFor = await $user!.emporionClient.orders_for_seller({
            addr: $user!.address,
        });
        const ordersFrom = await $user!.emporionClient.orders_from_buyer({
            addr: $user!.address,
        });
        return {
            ordersFor,
            ordersFrom,
        };
    };

    const getDeliveryDate = (expiration:Expiration)=>{
        if('at_time' in expiration){
            return new Date(Number(expiration.at_time.slice(0, 13)))
        }
    }
    const getTotal = ()=>{

    }
</script>

<Menu>
    <SearchBar></SearchBar>
</Menu>

{#await fetchData($user) then { ordersFrom }}
    <div class="table">
        {#each ordersFrom[0] as order}
        <div class="line">
            <div>{order.seller}</div>
            <div>{getDeliveryDate(order.expected_delivery)}</div>
            <div>{order.cart}</div>
            <div>{order.status}</div>
        </div>
        {/each}
    </div>
{/await}

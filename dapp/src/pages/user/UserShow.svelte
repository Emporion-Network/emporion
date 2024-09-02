<script lang="ts">
    import Menu from "../../lib/Menu.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import { api, user } from "../../stores/user";
    import OrdersTable from "./components/OrdersTable.svelte";

   

    const fetchData = async (_?: any) => {
        const ordersFrom = await $user!.emporionClient.orders_from_buyer({
            addr: $user!.address,
        });
        const data = await Promise.all(ordersFrom[0].map(async o => {
            return {
                order:o,
                metaData:await api.orderMetaDataGet(o.id.toString())
            }
        }));
        return {
            ordersFrom:data,
        };
    };

   
</script>

<Menu>
    <SearchBar></SearchBar>
</Menu>

<div class="page">
    {#await fetchData($user) then { ordersFrom }}
       <OrdersTable items={ordersFrom}></OrdersTable>
    {/await}
</div>

<style lang="scss">
    @use "../../media.scss";
    .page {
        display: flex;
        flex-direction: column;
        margin: 0 5%;
    }
</style>

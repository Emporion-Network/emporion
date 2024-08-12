<script lang="ts" context="module">
    const {
        VITE_ENDPOINT_RPC: ENDPOINT_RPC,
        VITE_STORE_ADDRESS: STORE_ADDRESS,
    } = import.meta.env;
    const client = new EmporionQueryClient(
        await CosmWasmClient.connect(ENDPOINT_RPC),
        STORE_ADDRESS,
    );
</script>
<script lang="ts">
    import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
    import Menu from "../../lib/Menu.svelte";
    import { search } from "../../lib/utils";
    import { EmporionQueryClient } from "../../../../client-ts/Emporion.client";
    import ProductCard from "./components/ProductCard.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import { href } from "../../stores/location";

    $:searchText = $href.searchParams.get('q')||"";
    $:category = $href.searchParams.get('category')||"";
    
    $:products = search(searchText, category).then(metas => {
        return Promise.all(metas.map(async m => {
            return {
                meta: m,
                product: await client.productById({productId:Number(m.id)})
            }
        }))
    });
</script>
<Menu>
    <SearchBar {searchText} selected={[category]}></SearchBar>
</Menu>
<div class="grid">
    {#await products then products}
        {#each products as {meta, product}}
            <ProductCard {product} {meta}></ProductCard>
        {/each}
    {/await}
</div>

<style lang="scss">
    .grid{
        padding: 0 5%;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 2rem;
    }
</style>
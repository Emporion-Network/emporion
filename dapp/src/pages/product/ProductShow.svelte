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
    import ProductShow from "./components/ProductPickerShow.svelte";
    import { href, historyReplace } from "../../stores/location";
    import { EmporionQueryClient } from "../../../../client-ts/Emporion.client";
    import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
    import { getProduct, getProductsMeta } from "../../lib/utils";
    import Menu from "../../lib/Menu.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import type { Product } from "../../../../client-ts/Emporion.types";
    import type { ProductMetaData } from "../../../../shared-types";
    let productId:string;
    let metas:ProductMetaData[] = [];
    let products:Product[] = [];

    $:productId, (()=>{
        if($href.searchParams.get('p') === productId || !productId) return;
        const u = new URL($href.href)
        u.searchParams.set('p', productId);
        historyReplace(u.href);
    })()

    href.subscribe(async (newHref) => {
        const newPid = newHref.searchParams.get("p");
        if(!newPid || productId == newPid) return;
        const mp = await getProduct(newPid) as ProductMetaData;
        const p = await client.product_by_id({product_id:Number(newPid)})
        const newMetas = await getProductsMeta(p.seller, mp.collection_id);
        const newProducts = (await Promise.all(newMetas.map(({id})=>{
            if(Number(id) === p.id) return p;
            return client.product_by_id({product_id:Number(id)})
        }))).filter(e => e !== undefined)
        .filter(e => e.is_listed)
        const listed = newProducts.map(e => `${e.id}`);
        metas = newMetas.filter(i => listed.includes(i.id));
        products = newProducts;
        productId = newPid;
    });
</script>

<Menu>
    <SearchBar></SearchBar>
</Menu>
{#if products.length}
    <ProductShow products={products} metas={metas} bind:productId={productId}></ProductShow>
{/if}
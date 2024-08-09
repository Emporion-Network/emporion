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
    import ProductShow from "./components/ProductShow.svelte";
    import { goTo, href, historyReplace } from "../../stores/location";
    import { EmporionQueryClient } from "../../../../client-ts/Emporion.client";
    import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
    import { getProduct } from "../../lib/utils";
    import Menu from "../../lib/Menu.svelte";
    let productId = $href.searchParams.get("p")||"";
    let productInfo = client
        .productById({ productId: Number(productId) })
        .then((product) => {
            return getProduct(product.id).then((meta) => {
                return {
                    product,
                    meta,
                };
            });
        }).catch(e => {
            goTo('/')()
            return {
                product:undefined,
                meta:undefined
            }
        });
    $:productId, (()=>{
        const newUrl = new URL($href.href);
        newUrl.searchParams.set('p', productId);
        historyReplace(newUrl.href)
    })()
</script>

<Menu></Menu>
{#await productInfo then { product, meta }}
    {#if meta && product}
        <ProductShow {product} {meta} bind:productId={productId}></ProductShow>
    {/if}
{/await}

<script lang="ts">
    import type {
        AssetInfoBaseForAddr,
        Product,
    } from "../../../../../client-ts/Emporion.types";
    import type { ProductMetaData } from "../../../../../shared-types";
    import { getNames, getPrices, getProductsMeta, rotateObj } from "../../../lib/utils";
    import { prices } from "../../../stores/coins";
    import markdownit from "markdown-it";
    import { Decimal } from "@cosmjs/math";
    import PricePicker from "./PricePicker.svelte";
    import OverflowAddress from "../../../lib/OverflowAddress.svelte";
    import Stars from "../../../lib/Stars.svelte";
    import DisplayAttributes from "./DisplayAttributes.svelte";
    import { addItem, cart } from "../../../stores/cart";
    export let metas: ProductMetaData[];
    export let products: Product[];
    export let productId: string;
    

    const md = markdownit({
        linkify: false,
        html: false,
        breaks: true,
    });


    let r = rotateObj($prices, "onChainDenom");

    let product = products.find((p) => p.id === Number(productId)) as Product;
    let meta = metas.find((p) => p.id === productId) as ProductMetaData;
    let sellerNames = getNames(product.seller);
    let productPrices = getPrices(product, r);

    const addToCart = (denom:string)=>{
        console.log('heee')
        addItem({
            meta:meta,
            product:product,
            coinDenom:denom
        })
    }

    $:productId,(()=>{
        if(productId === meta.id) return;
        console.log('this is')
        product = products.find((p) => p.id === Number(productId)) as Product;
        meta = metas.find((p) => p.id === productId) as ProductMetaData;
        sellerNames = getNames(product.seller);
        productPrices = getPrices(product, r);
    })()

</script>

<div class="page">
    <div class="image">
        {#if productPrices.length}
            <div class="header">
                <div class="accepted-coins">
                    {#each productPrices.slice(0, 3) as { denom }}
                        <img
                            src={$prices[denom].icon}
                            alt={$prices[denom].chainName}
                        />
                    {/each}
                    {#if product.price.length > 3}
                        <span>+{product.price.length - 3}</span>
                    {/if}
                </div>
            </div>
        {/if}
        {#if meta.image}
            <img src={meta.image} alt={meta.name} />
        {:else}
            <i class="ri-image-fill"></i>
        {/if}
    </div>
    <div class="info">
        <div>
            Sold by:
            {#await sellerNames}
                <button class="button-link">
                    <OverflowAddress address={product.seller}></OverflowAddress>
                </button>
            {:then [name]}
                {#if name}
                    <button class="button-link">{name}</button>
                {:else}
                    <button class="button-link">
                        <OverflowAddress address={product.seller}
                        ></OverflowAddress>
                    </button>
                {/if}
            {/await}
        </div>
        <h1>{meta.name}</h1>
        <Stars bind:rating={product.rating}></Stars>
        <PricePicker bind:productPrices {addToCart}></PricePicker>
        <DisplayAttributes products={metas} bind:selectedProductId={productId}
        ></DisplayAttributes>
        <div class="description">
            {@html md.render(meta.description)}
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../media.scss";

    .page {
        display: flex;
        gap: 3rem;
        padding: 0 5%;
        align-items: flex-start;
        @include media.for-size(tablet-lg) {
            flex-direction: column;
            gap: 1rem;
            .info {
                width: 100%;
            }
            .image {
                width: 100%;
                position: relative;
                top: 0;
            }
        }
    }
    .info {
        flex: 5;
        color: var(--gray-12);
        display: flex;
        flex-direction: column;
        h1 {
            color: var(--gray-12);
            font-weight: bolder;
        }
        .description {
            color: var(--gray-11);
            :global(ul),
            :global(ol) {
                margin-left: 1rem;
            }
            :global(a) {
                color: var(--indigo-10);
                text-decoration: underline;
            }
        }
        .button-link {
            max-width: 30%;
            display: inline-flex;
            gap: 1ch;
            margin-left: 0.5ch;
            &:hover {
                text-decoration: none;
            }
        }
    }
    .image {
        flex: 4;
        aspect-ratio: 1;
        border: 1px solid var(--gray-6);
        border-radius: 8px 8px 5px 5px;
        overflow: hidden;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        position: sticky;
        top: 2rem;
        i {
            font-size: 5rem;
            color: var(--gray-3);
        }
        .header {
            background-color: var(--black-a3);
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 0.5rem;
            position: absolute;
            width: 100%;
            backdrop-filter: blur(4px);
            top: 0;
            .accepted-coins {
                display: flex;
                width: max-content;
                background-color: var(--gray-11);
                border: 1px solid var(--gray-12);
                padding: 3px;
                justify-content: flex-start;
                align-items: center;
                border-radius: 20px;
                color: var(--indigo-1);
                gap: 2px;
                span {
                    display: block;
                    padding-right: 5px;
                }
                img {
                    width: 22px;
                    height: 22px;
                    border-radius: 22px;
                }
            }
        }
    }
</style>

<script lang="ts">
    import type { Product } from "../../../../../client-ts/Emporion.types";
    import type { ProductMetaData } from "../../../../../shared-types";
    import OverflowAddress from "../../../lib/OverflowAddress.svelte";
    import Stars from "../../../lib/Stars.svelte";
    import { getPrices, rotateObj } from "../../../lib/utils";
    import { prices } from "../../../stores/coins";
    import { goTo, href } from "../../../stores/location";
    import { user } from "../../../stores/user";
    const { VITE_NATIVE_COIN: NATIVE_COIN } = import.meta.env;

    export let product: Product;
    export let meta: ProductMetaData;
    const link = new URL($href.href);
    link.pathname = `/product`;
    link.searchParams.set("p", meta.id);

    let r = rotateObj($prices, "onChainDenom");
    $: showPriceIn = $user?.selectedCoin || NATIVE_COIN;
    let productPrices = getPrices(product, r);
    $: selctedPrice =
        productPrices.find((p) => p.denom == showPriceIn) || productPrices[0];
</script>

<div
    class="product-card"
    on:click={goTo(link.href)}
    role="button"
    tabindex="0"
    on:keypress={() => {}}
>
    <div class="img-container">
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
        <img src={meta.image} alt={meta.name} />
    </div>
    <div class="info">
        <div class="wpr">
            <button class="button-link">
                <OverflowAddress address={product.seller}></OverflowAddress>
            </button>
            <Stars bind:rating={product.rating} small></Stars>
        </div>
        <h2>
            {selctedPrice.amount.toString()}
            {selctedPrice.denom}
            <span class="small"
                >≈ ${(
                    selctedPrice.amount.toFloatApproximation() *
                    $prices[showPriceIn].price.toFloatApproximation()
                ).toFixed(2)}</span
            >
        </h2>
        <h1>{meta.name}</h1>
    </div>
</div>

<style lang="scss">
    .product-card {
        display: flex;
        flex-direction: column;
        width: 100%;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid var(--gray-7);
        &:hover {
            background-color: var(--gray-2);
            cursor: pointer;
        }
        .info {
            padding: 0.5rem;
            h2 {
                font-size: 1.4rem;
                color: var(--gray-12);
                .small {
                    font-size: 0.8rem;
                    color: var(--gray-10);
                    font-weight: 500;
                }
            }
            .wpr {
                display: flex;
                justify-content: space-between;
                .button-link {
                    width: 50%;
                    overflow: hidden;
                }
            }
            h1 {
                color: var(--gray-12);
                font-size: 1rem;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2; /* number of lines to show */
                line-clamp: 2;
                -webkit-box-orient: vertical;
                font-weight: 500;
            }
        }
        .img-container {
            position: relative;
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
        img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
        }
    }
</style>

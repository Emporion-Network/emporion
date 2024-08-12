<script lang="ts">
    import { addItem, cart, isVisible, removeItem, clear } from "../stores/cart";
    import { prices } from "../stores/coins";
    import { user } from "../stores/user";
    import { trapFocus } from "./directives";
    import OverflowAddress from "./OverflowAddress.svelte";
    import Qty from "./Qty.svelte";
    import RiskRatio from "./RiskRatio.svelte";
    import Slider from "./Slider.svelte";
    import { getPrices, rotateObj } from "./utils";
    let content: HTMLElement;
    type seller = string;
    type coin = string;
    type productId = number;
    type Grouped = Map<
        seller,
        Map<productId, Map<coin, (typeof $cart)[number] & { qty: number }>>
    >;

    let bySeller: Grouped = new Map();
    let r = rotateObj($prices, "onChainDenom");

    $: bySeller = $cart.reduce((acc, p) => {
        if (!acc.has(p.product.seller)) {
            const m = new Map();
            m.set(p.product.id, new Map());
            acc.set(p.product.seller, m);
        }
        if (!acc.get(p.product.seller)?.has(p.product.id)) {
            acc.get(p.product.seller)?.set(p.product.id, new Map());
        }
        const v = acc
            .get(p.product.seller)
            ?.get(p.product.id)
            ?.get(p.coinDenom) || {
            ...p,
            qty: 0,
        };
        v.qty += 1;
        acc.get(p.product.seller)?.get(p.product.id)?.set(p.coinDenom, v);
        return acc;
    }, new Map() as Grouped);

    const handleClickOutside = (e: MouseEvent) => {
        if (!e.target) return;
        let t = e.target as Node;
        if (content.contains(t) || t === content) {
            return;
        }
        $isVisible = false;
    };

    const buyAll = ()=>{
        // $user?.emporionClient.createOrder({

        // })
        clear()
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if $isVisible}
    <div class="cart" on:click={handleClickOutside} use:trapFocus>
        <div class="content" bind:this={content}>
            <button
                class="button-3-2 close"
                on:click={() => ($isVisible = false)}
            >
                <i class="ri-close-line"></i>
            </button>
            <h1>Cart</h1>
            {#if $cart.length > 0}
                {#each bySeller as [seller, products]}
                    <div class="group">
                        <div>Seller:
                            <button class="seller button-link">
                                <OverflowAddress address={seller}></OverflowAddress>
                            </button>
                        </div>
                        <div class="items">
                            {#each products as [_, productIds]}
                                {#each productIds as [_, { meta, product, coinDenom, qty, key }] (key)}
                                    {@const price = getPrices(product, r).find(
                                        (c) => c.denom == coinDenom,
                                    )}
                                    <div class="item">
                                        <img src={meta.image} alt={meta.name} />
                                        <p>{meta.name}</p>
                                        <div class="price-qty">
                                            {price?.amount}{price?.denom}
                                            <Qty
                                                incr={() =>
                                                    addItem({
                                                        product,
                                                        meta,
                                                        coinDenom,
                                                    })}
                                                decr={(e) => {
                                                    e.stopPropagation();
                                                    removeItem(key);
                                                }}
                                                bind:qty
                                            ></Qty>
                                        </div>
                                    </div>
                                {/each}
                            {/each}
                        </div>
                        {#if bySeller.size > 1}
                            <button class="button-2">Pay this seller only</button>
                        {/if}
                        <RiskRatio></RiskRatio>
                    </div>
                {/each}
                {#if bySeller.size > 1}
                    <button class="button-1 buy-button">Buy all</button>
                    {:else}
                    <button class="button-1 buy-button">Buy</button>
                {/if}
            {/if}
            {#if $cart.length == 0}
                <div class="empty">
                    <i class="ri-shopping-cart-2-line"></i>
                    <p>You don't have any items in your cart.</p>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss">
    .cart {
        background-color: var(--black-a4);
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 90;
        backdrop-filter: blur(10px);
        display: flex;
        outline: none;
        .content {
            width: 40%;
            height: 100%;
            background-color: var(--gray-1);
            position: absolute;
            right: 0;
            overflow-y: auto;
            color: var(--gray-11);
            display: flex;
            flex-direction: column;
            border-left: 1px solid var(--gray-6);
            gap: 1rem;
            padding-bottom: 4rem;
            .empty {
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                height: 100%;
                p {
                    font-weight: 600;
                }
                i {
                    font-size: 2rem;
                }
            }
            .seller{
                max-width: 25%;
            }
            h1 {
                padding: 1rem;
                color: var(--gray-12);
            }
            .button-1, .button-2 {
                height: 3rem;
            }
            .buy-button {
                position: fixed;
                width: calc(40% - 2rem);
                bottom: 1rem;
                right: 1rem;
            }
            .close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                aspect-ratio: 1;
            }
            .group {
                padding: 1rem;
                background-color: var(--gray-2);
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .items {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            .item {
                display: flex;
                align-items: flex-start;
                gap:1rem;
                .price-qty {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                p {
                    flex: 1;
                }
                img {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 5px;
                    border: 1px solid var(--gray-11);
                }
            }
        }
    }
</style>

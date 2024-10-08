<script lang="ts">
    import type { CreateOrderExecuteMsg } from "../../../client-ts/Emporion.client";
    import type { Product } from "../../../client-ts/Emporion.types";
    import { Decimal } from "@cosmjs/math";

    import {
        addItem,
        cart,
        isVisible,
        removeItem,
        clear,
    } from "../stores/cart";
    import { prices } from "../stores/coins";
    import { api, logIn, user } from "../stores/user";
    import { trapFocus } from "../directives";
    import OverflowAddress from "./OverflowAddress.svelte";
    import Qty from "./Qty.svelte";
    import RiskRatio from "./RiskRatio.svelte";
    import { extractAttr, getPrices, rotateObj } from "../utils";
    import { notification } from "./Notifications.svelte";
    import PostalAddresses from "./PostalAddresses.svelte";
    let content: HTMLElement;
    let postalAddress = "";
    type seller = string;
    type coin = string;
    type productId = number;
    type Grouped = Map<
        seller,
        {
            riskRatio: number;
            total:Record<string, Decimal>;
            products: Map<
                productId,
                Map<coin, (typeof $cart)[number] & { qty: number }>
            >;
        }
    >;

    let bySeller: Grouped = new Map();
    let r = rotateObj($prices, "onChainDenom");

    $: bySeller = $cart.reduce((acc, p) => {
        if (!acc.has(p.product.seller)) {
            const m = new Map();
            m.set(p.product.id, new Map());
            let riskRatio = bySeller.get(p.product.seller)?.riskRatio ?? 50;

            acc.set(p.product.seller, { products: m, riskRatio, total:Object.create(null) });
        }
        if (!acc.get(p.product.seller)?.products.has(p.product.id)) {
            acc.get(p.product.seller)?.products.set(p.product.id, new Map());
        }
        const v = acc
            .get(p.product.seller)
            ?.products.get(p.product.id)
            ?.get(p.coinDenom) || {
            ...p,
            qty: 0,
        };
        const price= getPrices(p.product, r).find((c) => c.denom == p.coinDenom)!.amount;
        acc.get(p.product.seller)!.total[p.coinDenom] = 
        (acc.get(p.product.seller)!.total[p.coinDenom] || Decimal.zero($prices[p.coinDenom].coinDecimals))
        .plus(price)

        v.qty += 1;
        acc.get(p.product.seller)
            ?.products.get(p.product.id)
            ?.set(p.coinDenom, v);
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

    const isDisabeled = (postalAddress:string, addr?:string)=>{
        if(postalAddress.length == 0) return true;
        if(addr){
            return !Object.keys(bySeller.get(addr)!.total).reduce((acc, c)=>{
                return acc && bySeller.get(addr)!.total[c].isLessThanOrEqual($prices[c].onChainAmount)
            }, true)
        }
        return ![...bySeller.keys()].reduce((curr, addr)=>{
            return curr && Object.keys(bySeller.get(addr)!.total).reduce((acc, c)=>{
                return acc && bySeller.get(addr)!.total[c].isLessThanOrEqual($prices[c].onChainAmount)
            }, true)
        }, true)
    }

    type Cart = CreateOrderExecuteMsg["cart"];

    const sameDenom = (p: Product["price"][number], denom: string) => {
        if ("native" in p.info) {
            return p.info.native === denom;
        }
        return p.info.cw20 === denom;
    };

    const createOrder = (seller?: string) => async () => {
        try {
            const addresses = await api.postalAddressesGet();
            if(!addresses.includes(postalAddress)){
                await api.postalAddressCreate(postalAddress)
            }
            if (seller) {
                const native: Record<string, Decimal> = {};
                const cw20: Record<string, Decimal> = {};
                const [nativeCart, cw20Cart] = $cart
                    .filter((i) => i.product.seller === seller)
                    .reduce(
                        (acc, c) => {
                            const onChainDenom =
                                $prices[c.coinDenom].onChainDenom;
                            const decimals = $prices[c.coinDenom].coinDecimals;
                            if (!$prices[c.coinDenom].isCw20) {
                                if (!native[onChainDenom]) {
                                    native[onChainDenom] =
                                        Decimal.zero(decimals);
                                }
                                native[onChainDenom] = Decimal.fromAtomics(
                                    c.product.price.find((p) =>
                                        sameDenom(p, onChainDenom),
                                    )?.amount || "",
                                    decimals,
                                ).plus(native[onChainDenom]);
                                acc[0].push([
                                    c.product.id,
                                    {
                                        native: onChainDenom,
                                    },
                                ]);
                            } else {
                                if (!cw20[onChainDenom]) {
                                    cw20[onChainDenom] = Decimal.zero(decimals);
                                }
                                cw20[onChainDenom] = Decimal.fromAtomics(
                                    c.product.price.find((p) =>
                                        sameDenom(p, onChainDenom),
                                    )?.amount || "",
                                    decimals,
                                ).plus(cw20[onChainDenom]);
                                acc[1].push([
                                    c.product.id,
                                    {
                                        cw20: onChainDenom,
                                    },
                                ]);
                            }
                            return acc;
                        },
                        [[], []] as [Cart, Cart],
                    );
                let orderId: number = -1;
                if (nativeCart.length > 0) {
                    let r = await $user?.emporionClient.create_order(
                        {
                            buyer_risk_share: [
                                bySeller.get(seller)?.riskRatio ?? 50,
                                100,
                            ],
                            cart: nativeCart,
                            ready: cw20Cart.length === 0,
                            seller: seller,
                        },
                        "auto",
                        "",
                        Object.keys(native).map((e) => {
                            return {
                                denom: e,
                                amount: native[e].atomics,
                            };
                        }).sort((a,b) => a.denom.localeCompare(b.denom)),
                    );
                    if (!r) throw Error("Unknown error");
                    orderId = Number(extractAttr("order_id", r));
                }
                if (cw20Cart.length > 0 && orderId === -1) {
                    const denom =
                        "native" in cw20Cart[0][1]
                            ? cw20Cart[0][1].native
                            : cw20Cart[0][1].cw20;
                    let r = await $user?.emporionClient.client.execute(
                        $user.emporionClient.sender,
                        denom,
                        {
                            send: {
                                amount: cw20[denom].atomics,
                                contract: $user.emporionClient.contractAddress,
                                msg: btoa(JSON.stringify({
                                    create_order: {
                                        buyer_risk_share: [
                                            bySeller.get(seller)?.riskRatio,
                                            100,
                                        ],
                                        cart: cw20Cart.filter(([_, p]) =>
                                            sameDenom(
                                                { info: p, amount: "" },
                                                denom,
                                            ),
                                        ),
                                        ready: cw20Cart.length === 1,
                                        seller: seller,
                                    },
                                })),
                            },
                        },
                        "auto",
                    );
                    if (!r) throw Error("Unknown error");
                    cw20Cart.shift();
                    orderId = Number(extractAttr("order_id", r));
                }
                if (cw20Cart.length > 0) {
                    const instructions = Object.keys(cw20).map((denom) => {
                        return {
                            contractAddress: denom,
                            msg: {
                                send: {
                                    amount: cw20[denom].atomics,
                                    contract:$user!.emporionClient.contractAddress,
                                    msg: btoa(
                                        JSON.stringify({
                                            add_products_to_order: {
                                                order_id: orderId,
                                                cart: cw20Cart.filter(
                                                    ([_, p]) =>
                                                        sameDenom(
                                                            {
                                                                info: p,
                                                                amount: "",
                                                            },
                                                            denom,
                                                        ),
                                                ),
                                            },
                                        }),
                                    ),
                                },
                            } as any,
                        };
                    });
                    instructions.push({
                        contractAddress:$user!.emporionClient.contractAddress,
                        msg: { finalize_order: { order_id: orderId } },
                    });
                    await $user?.emporionClient.client.executeMultiple(
                        $user?.emporionClient.sender,
                        instructions,
                        "auto",
                    );
                }
                $cart.filter((i) => i.product.seller === seller).forEach(i => {
                    removeItem(i.key)
                })
                await api.orderMetaDataCreate(postalAddress, String(orderId));
            } else {
                // sellers with orders of native only amounts
                const nativeOnly = [...bySeller.keys()].filter((seller) => {
                    return $cart
                        .filter((i) => i.product.seller === seller)
                        .every((i) => !$prices[i.coinDenom].isCw20);
                });
                const instructions = nativeOnly.map((seller) => {
                    const coins: Record<string, Decimal> = {};
                    const cart: Cart = [];
                    $cart
                        .filter((i) => i.product.seller === seller)
                        .forEach((i) => {
                            const coin = $prices[i.coinDenom];
                            if (!coins[coin.onChainDenom]) {
                                coins[coin.onChainDenom] = Decimal.zero(
                                    coin.coinDecimals,
                                );
                            }
                            coins[coin.onChainDenom] = Decimal.fromAtomics(
                                i.product.price.find((p) =>
                                    sameDenom(p, coin.onChainDenom),
                                )?.amount || "",
                                coin.coinDecimals,
                            ).plus(coins[coin.onChainDenom]);
                            cart.push([
                                i.product.id,
                                { native: coin.onChainDenom },
                            ]);
                        });
                    return {
                        contractAddress:
                            $user!.emporionClient.contractAddress,
                        msg: {
                            create_order: {
                                buyer_risk_share: [
                                    bySeller.get(seller)?.riskRatio || 50,
                                    100,
                                ],
                                cart: cart,
                                ready: true,
                                seller: seller,
                            },
                        },
                        funds: Object.keys(coins).map((e) => ({
                            denom: e,
                            amount: coins[e].atomics,
                        })).sort((a,b) => a.denom.localeCompare(b.denom)),
                    };
                });
                await $user?.emporionClient.client.executeMultiple(
                    $user?.emporionClient.sender,
                    instructions,
                    "auto",
                );
                clear();
            }
            isVisible.set(false)
        } catch (e) {
            let text = "Unknown error";
            if (e instanceof Error) {
                text = e.message;
            }
            notification({
                type: "error",
                text,
            });
        }
    };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if $isVisible}
    <div class="cart" use:trapFocus on:click={handleClickOutside}>
        <div class="content" bind:this={content}>
            <button
                class="button-3-2 close"
                on:click={() => ($isVisible = false)}
            >
                <i class="ri-close-line"></i>
            </button>
            <h1>Cart</h1>
            {#if $cart.length > 0}
                {#if $user}
                    <PostalAddresses bind:postalAddress></PostalAddresses>
                {/if}
                <div class="buy-container">
                    {#if $user}
                    {#if bySeller.size > 1}
                        <button
                            class="button-1 buy-button"
                            disabled={isDisabeled(postalAddress)}
                            on:click={createOrder()}>Buy all</button
                        >
                    {:else}
                        <button
                            class="button-1 buy-button"
                            on:click={createOrder([...bySeller.keys()][0])}
                            disabled={isDisabeled(postalAddress, [...bySeller.keys()][0])}
                            >Buy</button
                        >
                    {/if}
                    {:else}
                         <button on:click={logIn} class="button-1 buy-button">Login to checkout</button>
                    {/if}
                </div>
                {#each bySeller as [seller, { riskRatio, products }]}
                    <div class="group">
                        <div>
                            Seller:
                            <button class="seller button-link">
                                <OverflowAddress address={seller}
                                ></OverflowAddress>
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
                        <RiskRatio bind:value={riskRatio} />
                        {#if bySeller.size > 1}
                            <button
                                class="button-2"
                                on:click={createOrder(seller)}
                                disabled={isDisabeled(postalAddress, seller)}
                                >Pay this seller only</button
                            >
                        {/if}
                    </div>
                {/each}
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
    @use "../media.scss";
    .cart {
        background-color: var(--black-a4);
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 90;
        backdrop-filter: blur(0px);
        display: flex;
        outline: none;
        animation: blur 200ms ease-in-out forwards;

        @keyframes blur {
            from {
                backdrop-filter: blur(0px);
            }
            to {
                backdrop-filter: blur(10px);
            }
        }

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
            animation: slide 200ms ease-in-out forwards;
            @keyframes slide {
                from {
                    right: -100%;
                }
                to {
                    right: 0;
                }
            }

            @include media.for-size(tablet-lg) {
                width: 60%;
            }
            @include media.for-size(phone) {
                width: 100%;
            }
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
            .seller {
                max-width: 25%;
            }
            h1 {
                padding: 1rem;
                color: var(--gray-12);
            }
            .button-1,
            .button-2 {
                height: 3rem;
            }
            .buy-button {
                min-height: 3rem;
                flex:1;
            }
            .buy-container{
                position: sticky;
                top: calc(100vh - 5rem);
                margin-top: -6rem;
                z-index: 2;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 1rem;
                background-color: var(--gray-2);
                border-top: 1px solid var(--gray-6);
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
                &:last-of-type {
                    padding-bottom: 6rem;
                }

            }
            .items {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            .item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
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

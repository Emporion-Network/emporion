<script lang="ts">
    import type {
        AssetBaseForAddr,
        Review,
    } from "../../../../../client-ts/Emporion.client";
    import type { ProductMetaData } from "../../../../../shared-types";
    import { prices } from "../../../stores/coins";
    import { api, user } from "../../../stores/user";
    import { rotateObj, getOnChainDenom } from "../../../utils";
    import { Decimal, Uint32 } from "@cosmjs/math";
    import Attributes from "./Attributes.svelte";
    import Rate from "../../../lib/Rate.svelte";
    import Description from "../../../lib/Description.svelte";
    import LoaderButton from "../../../lib/LoaderButton.svelte";
    export let orderId:number;

    export let cart: [number, AssetBaseForAddr][] = [];
    export let showRate = false;
    const getProductReview = async (id: number, order: number) => {
        return (
            await $user?.emporionClient.reviews_of_product({
                product_id: id,
                start_from: order,
            })
        )?.[0][0] || {} as Review;
    };
    Promise.all(
        cart.map(async (e) => ({
            product: await api.productGet(e[0].toString()),
            price: e[1],
            review: (await getProductReview(e[0], orderId)) || ({} as Review),
        })),
    ).then((items) => {
        items.forEach((e) => {
            const coin = getOnChainDenom(e.price.info);
            if (!groupped.has(e.product.id)) {
                groupped.set(e.product.id, new Map());
            }
            if (!groupped.get(e.product.id)!.has(coin)) {
                groupped.get(e.product.id)!.set(coin, []);
            }
            groupped.get(e.product.id)!.get(coin)?.push(e);
        });
        groupped = groupped;
    });
    let r = rotateObj($prices, "onChainDenom");
    type Items = { product: ProductMetaData; price: AssetBaseForAddr, review:Review }[];
    let groupped = new Map<string, Map<string, Items>>();

    const submitReview = (item:Items[0])=>async ()=>{
        await $user?.emporionClient.review_product({
            order_id:orderId,
            product_id:Number(item.product.id),
            rating:item.review.rating,
            message:item.review.message
        }, 'auto')
    }
</script>

{#each groupped as [_, byCoin]}
    {#each byCoin as [coin, items]}
        {@const item = items[0].product}
        {@const nbItems = items.length}
        {@const coinData = r[coin]}
        {@const price = Decimal.fromAtomics(
            items[0].price.amount,
            coinData.coinDecimals,
        )}
        {@const priceUsd =
            coinData.price.toFloatApproximation() *
            price.toFloatApproximation()}
        {@const totalUsd = items.length * priceUsd}
        <div class="cart-item">
            <div class="info">
                <img src={item.image} alt={item.name} />
                <div>
                    <p>{nbItems} x {item.name}</p>
                    <Attributes attributes={item.attributes}></Attributes>
                </div>
                <div>
                    <span>{price.toString()}{coinData.coinDenom}</span>
                    <span>≈${priceUsd}</span>
                </div>
                <div>
                    <span
                        >{price.multiply(
                            new Uint32(nbItems),
                        )}{coinData.coinDenom}</span
                    >
                    <span>≈${totalUsd}</span>
                </div>
            </div>
            <div class="review">
                {#if showRate}
                    <h2>Review Product</h2>
                    <Rate bind:rating={items[0].review.rating}></Rate>
                    <Description bind:value={items[0].review.message} placeholder={"Review message"} rows={3}></Description>
                    <LoaderButton class="button-2" onClick={submitReview(items[0])}>Submit review</LoaderButton>
                {/if}
                {#if !showRate && items[0].review.message}
                    <Rate readOnly bind:rating={items[0].review.rating}></Rate>
                    <Description readOnly bind:value={items[0].review.message} placeholder={"Review message"} rows={3}></Description>
                    {:else if !showRate}
                    <p>Product hasnt been reviewed yet</p>
                {/if}
            </div>
        </div>
    {/each}
{/each}

<style lang="scss">
    .cart-item {
        display: flex;
        flex-direction: column;
        padding: 1rem 0;
        border-bottom: 1px solid var(--gray-6);
        .info {
            display: flex;
            gap: 1rem;
            align-items: flex-start;
            p {
                overflow: hidden;
                text-overflow: ellipsis;
            }
            div {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                &:first-of-type {
                    margin-right: auto;
                }
            }
            img {
                width: 70px;
                height: 70px;
            }
        }
        .review{
            p{
                text-align: center;
                padding: 1rem;
                color: var(--gray-10);
            }
        }
    }
</style>

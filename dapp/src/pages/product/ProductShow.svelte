<script lang="ts">
    import ProductShow from "./components/ProductPickerShow.svelte";
    import { href, historyReplace } from "../../stores/location";
    import Menu from "../../lib/Menu.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import type { Product } from "../../../../client-ts/Emporion.types";
    import type { ProductMetaData } from "../../../../shared-types";
    import { api } from "../../stores/user";
    import { clients } from "../../stores/readStores";
    import type { Review } from "../../../../client-ts/Emporion.client";
    import OverflowAddress from "../../lib/OverflowAddress.svelte";
    import Rate from "../../lib/Rate.svelte";
    import Stars from "../../lib/Stars.svelte";
    let productId: string;
    let metas: ProductMetaData[] = [];
    let products: Product[] = [];
    let reviews: Review[] = [];

    $: productId,
        (async () => {
            if ($href.searchParams.get("p") === productId || !productId) return;
            const u = new URL($href.href);
            u.searchParams.set("p", productId);
            historyReplace(u.href);
            reviews = (
                await $clients.emporionQueryClient.reviews_of_product({
                    product_id: Number(productId),
                })
            )[0];
        })();

    href.subscribe(async (newHref) => {
        const newPid = newHref.searchParams.get("p");
        if (!newPid || productId == newPid) return;
        const mp = await api.productGet(newPid);
        const p = await $clients.emporionQueryClient.product_by_id({
            product_id: Number(newPid),
        });
        const newMetas = await api.sellerCollectionsMetasGet(
            p.seller,
            mp.collection_id,
        );
        const newProducts = (
            await Promise.all(
                newMetas.map(({ id }) => {
                    if (Number(id) === p.id) return p;
                    return $clients.emporionQueryClient.product_by_id({
                        product_id: Number(id),
                    });
                }),
            )
        )
            .filter((e) => e !== undefined)
            .filter((e) => e.is_listed);
        const listed = newProducts.map((e) => `${e.id}`);
        metas = newMetas.filter((i) => listed.includes(i.id));
        products = newProducts;
        productId = newPid;
        reviews = (
                await $clients.emporionQueryClient.reviews_of_product({
                    product_id: Number(productId),
                })
            )[0];
    });

    const getAvg = (rating: Product["rating"]) => {
        return rating.reduce(
            (acc, c, i) => {
                acc[0] += c * i;
                acc[1] += c;
                return acc;
            },
            [0, 0] as [number, number],
        );
    };
</script>

<Menu>
    <SearchBar></SearchBar>
</Menu>
{#if products.length}
    {@const product = products.find((e) => e.id === Number(productId))}
    <ProductShow {products} {metas} bind:productId></ProductShow>
    <div class="reviews">
        <h2>Reviews</h2>
        <div class="content">
            {#if product}
                {@const rate = getAvg(product.rating)}
                <div class="filters">
                    <div>
                        <h2>
                            {(rate[1] ? rate[0]/rate[1] : 0).toFixed(1)}
                        </h2>
                        <Stars showTotal={false} rating={product.rating}/>
                        <div>
                            {rate[1]} review{rate[1] > 1? "s":""}
                        </div>
                    </div>
                    <div class="proportions">
                        {#each { length: 6 } as _, i}
                            <div>
                                {5 - i}
                                <div class="nb" style="--p:{rate[1] ? product.rating[5 - i]/rate[1] : 0}"></div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            <div class="reviews-list">
                {#each reviews as review}
                    <div class="review">
                        <OverflowAddress address={review.from} />
                        <Rate readOnly rating={review.rating}></Rate>
                        <p>{review.message}</p>
                    </div>
                {/each}
                {#if reviews.length == 0}
                    <p>No reviews for this product yet</p>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .reviews {
        display: flex;
        flex-direction: column;
        margin: 0 5%;
        color: var(--gray-12);
        .filters {
            flex: 1;
            display: flex;
            gap: 1rem;
            & > div {
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            .proportions {
                div {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 85%;
                }
                .nb {
                    height: 4px;
                    background-color: var(--gray-5);
                    border-radius: 4px;
                    position: relative;
                    overflow: hidden;
                    &::after{
                        content: "";
                        position: absolute;
                        height: 100%;
                        background-color: var(--indigo-10);
                        width: calc(var(--p) * 100%);
                    }
                }
            }
            h2 {
                font-size: 4rem;
            }
        }
        .content {
            display: flex;
            gap: 3rem;
        }
    }
    .reviews-list {
        display: flex;
        flex-direction: column;
        flex: 3;
        & > p {
            color: var(--gray-11);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
        }
    }
    .review {
        display: flex;
        flex-direction: column;
    }
</style>

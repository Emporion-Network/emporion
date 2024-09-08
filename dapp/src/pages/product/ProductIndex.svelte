<script lang="ts">
    import Menu from "../../lib/Menu.svelte";
    import ProductCard from "./components/ProductCard.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import { href } from "../../stores/location";
    import { api } from "../../stores/user";
    import { clients } from "../../stores/readStores";

    $: searchText = $href.searchParams.get("q");
    $: category = $href.searchParams.get("category") || "";
    $: page = $href.searchParams.get("page") || "";

    

    $: products = (
        searchText ? api.productsSearch(searchText, category, page) : api.productsList(page)
    ).then((metas) => {
        return Promise.all(
            metas.map(async (m) => {
                return {
                    meta: m,
                    product: await $clients.emporionQueryClient.product_by_id({
                        product_id: Number(m.id),
                    }),
                };
            }),
        );
    }).then(async (metas) => {
        const addrs = await $clients.emporionQueryClient.blacklisted_check({
            addrs:metas.map(e => e.product.seller),
        })
        return metas.filter(e => !addrs.includes(e.product.seller));
    });

</script>

<Menu>
    <SearchBar searchText={searchText || ""} selected={[category]}></SearchBar>
</Menu>
<div class="grid">
    {#await products then products}
        {#each products as { meta, product }}
            {#if product.is_listed}
                <ProductCard {product} {meta}></ProductCard>
            {/if}
        {/each}
    {/await}
</div>

<style lang="scss">
    @use "../../media.scss";
    .grid {
        padding: 0 5%;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 2rem;
        @include media.for-size(tablet-lg) {
            grid-template-columns: 1fr 1fr 1fr;
        }
        @include media.for-size(phone) {
            grid-template-columns: 1fr 1fr;
        }
        @include media.for-size(phone-sm) {
            grid-template-columns: 1fr;
        }
    }
</style>

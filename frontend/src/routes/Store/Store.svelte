<script lang="ts">
  import SearchBar from "./SearchBar.svelte";
  import Product from "./Product.svelte";
  import Promoted from "./Promoted.svelte";
  import { getLocation } from "@/stores/location.svelte";
  import { user } from "@/stores/user.svelte";
  import { onMount } from "svelte";
  import type { ProductMetadata } from "@common";
  import { bechToBech } from "@/lib/utils";
  const location = getLocation();
  let products: (ProductMetadata & { mark: number[] })[] = $state([]);
  async function fetchProducts() {
    const req = await user.scrollProducts({
      search: location.url.searchParams.get("search") || undefined,
      max_price: location.url.searchParams.get("max_price") || undefined,
      min_price: location.url.searchParams.get("min_price") || undefined,
      sort: location.url.searchParams.get("sort") || undefined,
      seller: location.url.searchParams.get("seller") || undefined,
      category: location.url.searchParams.get("category") || undefined,
      start_after: location.url.searchParams.get("start_after") || undefined,
    });
    if (!req.error) {
      const ec = await user.ec;
      const sellers: Record<string, number[]> = {};
      products = await Promise.all(
        req.result.map(async (e) => {
          const p = await ec.getProduct({ id: e.id });
          if (!sellers[e.seller]) {
            const m = await ec.getMark({ addr: bechToBech(e.seller, "juno") });
            sellers[e.seller] = m;
            return { ...e, mark: m, price: p.price };
          } else {
            return { ...e, mark: sellers[e.seller], price: p.price };
          }
        }),
      );
    }
  }
  onMount(async () => {
    await fetchProducts();
  });
</script>

<SearchBar></SearchBar>
<div class="products">
  {#if products.length > 0}
    {#each products as product}
      <Product {product} />
    {/each}
  {:else}
    {#each { length: 4 } as _}
      <Product skeleton />
    {/each}
    <Promoted skeleton></Promoted>
    {#each { length: 4 } as _}
      <Product skeleton />
    {/each}
  {/if}
</div>

<style lang="scss">
  @use "../../mixins" as m;

  .products {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    padding: 0 1rem;
    @include m.media("<=tablet-lg") {
      grid-template-columns: 1fr 1fr 1fr;
    }
    @include m.media("<=tablet") {
      grid-template-columns: 1fr 1fr;
    }
    @include m.media("<=phone") {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import SearchBar from "./SearchBar.svelte";
  import Product from "./Product.svelte";
  import Promoted from "./Promoted.svelte";
  import { getLocation } from "@/stores/location.svelte";
  import { user } from "@/stores/user.svelte";
  import { onMount, tick } from "svelte";
  import type { ProductMetadata } from "@common";
  import { bechToBech } from "@/lib/utils";
  import { CATEGORIES } from "@common";
  let products: (ProductMetadata & { mark: number[] })[] = $state([]);
  let loading = $state(true);
  let search = $state("");
  let category = $state(CATEGORIES[0]);
  const l = getLocation();
  async function fetchProducts() {
    console.log(l.url.href);
    const req = await user.scrollProducts({
      search: l.url.searchParams.get("search") || undefined,
      max_price: l.url.searchParams.get("max_price") || undefined,
      min_price: l.url.searchParams.get("min_price") || undefined,
      sort: l.url.searchParams.get("sort") || undefined,
      seller: l.url.searchParams.get("seller") || undefined,
      category: l.url.searchParams.get("category") || undefined,
      start_after: l.url.searchParams.get("start_after") || undefined,
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
      loading = false;
    }
  }
  onMount(async () => {
    await fetchProducts();
  });

  const onsearch = () => {
    const url = new URL(l.url.href);
    if (search !== "") {
      url.searchParams.set("search", search);
    } else {
      url.searchParams.delete("search");
    }
    if (category !== CATEGORIES[0]) {
      url.searchParams.set("category", category);
    } else {
      url.searchParams.delete("category");
    }
    l.replace(url.href);
    fetchProducts();
  };
</script>

<SearchBar {onsearch} bind:search bind:category></SearchBar>
<div class="products">
  {#if !loading}
    {#each products as product}
      <Product {product} />
    {/each}
    {#if products.length == 0}
      <div class="empty">
        <h1>No products found</h1>
        <button class="primary-button" onclick={() => l.goTo("/my-store")}>
          List your products
        </button>
      </div>
    {/if}
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
    .empty {
      grid-column: 1 / span 4;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      min-height: 70vh;
      h1 {
        font-size: xx-large;
      }
      button {
        padding-left: 2rem;
        padding-right: 2rem;
      }
    }
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

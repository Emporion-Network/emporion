<script lang="ts">
  import Route from "@/lib/Route.svelte";
  import SearchBar from "./SearchBar.svelte";
  import Product from "./Product.svelte";
  import Promoted from "./Promoted.svelte";
</script>

<SearchBar></SearchBar>
<div class="products">
  {#each { length: 4 } as _}
    <Product skeleton />
  {/each}
  <Promoted skeleton></Promoted>
  {#each { length: 4 } as _}
    <Product skeleton />
  {/each}
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

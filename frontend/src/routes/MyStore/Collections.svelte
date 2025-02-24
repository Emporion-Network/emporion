<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import { Decimal } from "@cosmjs/math";
  import type { ProductMetadata } from "@common";
  import { getLocation } from "@/stores/location.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  const getMinMax = (products: ProductMetadata[]) => {
    let max = Decimal.fromAtomics(products[0].price, 6);
    let min = Decimal.fromAtomics(products[0].price, 6);
    for (const p of products) {
      const price = Decimal.fromAtomics(p.price, 6);
      if (price.isGreaterThan(max)) max = price;
      if (price.isLessThan(min)) min = price;
    }
    return [min, max] as const;
  };

  let t = getTranslator();
  let { goTo } = getLocation();
</script>

<div class="collections">
  <h2>Collections</h2>
  {#if user.address}
    <div class="grid">
      {#await user.getCollections(user.address!) then collections}
        {#if !collections.error}
          {#each [...collections.result, ...collections.result, ...collections.result, ...collections.result, ...collections.result, ...collections.result, ...collections.result, ...collections.result, ...collections.result, ...collections.result] as { collection, products }}
            {@const [min, max] = getMinMax(products)}
            {@const p = products.find((p) => p.gallery[t.lang])}
            <div
              class="collection"
              role="button"
              tabindex="0"
              onkeypress={() => {}}
              onclick={() =>
                goTo(`/collection?name=${encodeURIComponent(collection)}`)}
            >
              {#if p}
                <img src={p.gallery[t.lang][0]} alt="" />
              {/if}
              <div class="info">
                <h3>{collection} x{products.length}</h3>
                <span>{t.t(products[0].category[0] as any)}</span>
              </div>
              <div>
                {#if !min.equals(max)}
                  <span>{min.toString()} - {max.toString()} USDC</span>
                {:else}
                  <span>{min.toString()} USDC</span>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      {/await}
    </div>
  {/if}
</div>

<style lang="scss">
  .collections {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
    }
    .collection {
      display: flex;
      align-items: center;
      background-color: var(--neutral-3);
      padding: 1rem;
      border: 1px solid var(--neutral-6);
      border-radius: 3px;
      gap: 1rem;
      cursor: pointer;
      .info {
        margin-right: auto;
      }
      &:hover {
        border-color: var(--neutral-8);
        background-color: var(--neutral-4);
      }
      img {
        width: 62px;
        height: 62px;
        object-fit: cover;
        background-color: var(--neutral-3);
        border-radius: 3px;
        border: 1px solid var(--neutral-6);
        background-color: var(--neutral-5);
        padding: 3px;
      }
    }
  }
</style>

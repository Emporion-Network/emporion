<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import { Decimal } from "@cosmjs/math";
  import type { ProductMetadata, ResponseSuccess } from "@common";
  import { getLocation } from "@/stores/location.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  import Input from "@/lib/Input.svelte";
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
  let search = $state("");
  let t = getTranslator();
  let { goTo } = getLocation();
  type Collections = Extract<
    Awaited<ReturnType<typeof user.getCollections>>,
    { error: false }
  >["result"];
  let collections: Collections = $state([]);
  $effect(() => {
    if (!user.address) return;
    user.getCollections(user.address).then((e) => {
      if (e.error) return;
      collections = e.result;
    });
  });

  let filtered = $derived.by(() => {
    return collections.filter((c) => {
      return [
        c.collection.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        c.products.some((p) => {
          return (
            p.title[t.lang]
              .toLocaleLowerCase()
              .includes(search.toLocaleLowerCase()) ||
            p.description[t.lang]
              .toLocaleLowerCase()
              .includes(search.toLocaleLowerCase()) ||
            p.category.some((c) => {
              return t
                .t(c as any)
                .toLocaleLowerCase()
                .includes(search.toLocaleLowerCase());
            })
          );
        }),
      ].reduce((acc, b) => acc || b, false);
    });
  });
</script>

<div class="collections">
  <div class="title">
    <h2>{t.t("male_patient_cheetah_urge")}</h2>
    <button class="primary-button" onclick={() => goTo(`/collection`)}>
      <i class="ri-add-line"></i>
      <span>{t.t("safe_agent_guppy_shine")}</span>
    </button>
  </div>
  <div class="search">
    <Input
      type="search"
      placeholder={t.t("mean_patient_ladybug_learn")}
      label={t.t("mad_spry_elk_lead")}
      bind:value={search}
    ></Input>
  </div>
  <div class="grid">
    {#each filtered as { collection, products }}
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
  </div>
  {#if !collections.length}
    <p class="info">
      {t.t("icy_polite_ape_fold")}
    </p>
  {/if}
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .collections {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    .title {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .search {
      display: flex;
      justify-content: flex-start;
      width: 100%;
      :global(.input) {
        flex: 1;
        max-width: 500px;
      }
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
    }
    p {
      padding: 2rem 1rem;
      background-color: var(--neutral-2);
      color: var(--neutral-11);
      text-align: center;
      margin-bottom: 1rem;
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
        display: block;
        min-width: 62px;
        max-width: 62px;
        max-height: 62px;
        min-height: 62px;
        object-fit: contain;
        background-color: var(--neutral-3);
        border-radius: 3px;
        border: 1px solid var(--neutral-6);
        background-color: var(--neutral-5);
        padding: 3px;
      }
    }
    @include media("<= tablet-lg") {
      .grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @include media("<= phone") {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>

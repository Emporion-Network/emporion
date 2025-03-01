<script lang="ts">
  import { untrack } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { fly } from "svelte/transition";
  import Collapsable from "@/lib/Collapsable.svelte";
  import ContextMenu from "@/lib/ContextMenu.svelte";
  import Input from "@/lib/Input.svelte";
  import MultiSelect from "@/lib/MultiSelect.svelte";
  import TranslatableInput from "@/lib/TranslatableInput.svelte";
  import {
    getTranslator,
    supportedLangs,
    translatedArray,
    TranslatedLanguages,
    translatedString,
    type SupportedLanguage,
  } from "@/stores/translate.svelte";
  import { Decimal } from "@cosmjs/math";
  import AttributesInCollection from "./Attributes/InCollection.svelte";
  import AttributesInProduct from "./Attributes/InProduct.svelte";
  import { metas, type Attribute } from "./Attributes/_metas";
  import Categories from "./Categories.svelte";
  import Gallery from "./Gallery.svelte";
  import PriceInput from "./PriceInput.svelte";
  import { getTutoRegistry } from "./tutoStore.svelte";
  import Checkbox from "@/lib/Checkbox.svelte";
  import { user } from "@/stores/user.svelte";
  import {
    assertIsValidMetadata,
    type ProductMetadata,
    type CreateProductMetadata,
  } from "@common";
  import { getLocation } from "@/stores/location.svelte";
  import { looseEq } from "@/lib/utils";

  const { goTo } = getLocation();
  let t = getTranslator();
  let registry = getTutoRegistry();
  let {
    selectedProduct = $bindable(),
    products = $bindable(),
    selectedLang = $bindable(),
  }: {
    products: (ProductMetadata | CreateProductMetadata)[];
    selectedLang: SupportedLanguage;
    selectedProduct: number;
  } = $props();

  let attributes: Attribute[] = $state([]);
  let collectionName = $state("");
  let showProduct = $state(false);
  let categories: SvelteSet<string> = $state(new SvelteSet());
  let category = $derived(Array.from(categories.values()));
  let prevProducts: (ProductMetadata | CreateProductMetadata)[] = $state([]); // used to detect changes in products
  let hide = $state(false);

  let changed = $derived.by(() => {
    return !looseEq(prevProducts, products);
  });

  const addProduct = () => {
    products.push({
      title: translatedString(),
      description: translatedString(),
      collection: collectionName,
      category: category,
      gallery: translatedArray(),
      attributes: attributes.map((e) =>
        metas[e.display_type].bindClone(e as never),
      ),
      price: "0",
      listed: false,
    });
    toggleProductView(products.length - 1);
  };

  const onswap = (i: number, j: number) => {
    products.forEach((p) => {
      let temp = p.attributes[i];
      p.attributes[i] = p.attributes[j];
      p.attributes[j] = temp;
    });
  };

  const onremove = (idx: number) => {
    products.forEach((p) => {
      p.attributes = p.attributes.filter((_, i) => idx !== i);
    });
  };

  const onpush = () => {
    const a = attributes[attributes.length - 1];
    const bindClone = metas[a.display_type].bindClone;
    products.forEach((p) => {
      p.attributes.push(bindClone(a as never));
    });
  };

  $effect(() => {
    products.forEach((p) => {
      p.collection = collectionName;
      p.category = category;
    });
  });

  $effect.pre(() => {
    products;
    untrack(() => {
      prevProducts = $state.snapshot(products);
      attributes = $state.snapshot(products[0]?.attributes) || [];
      collectionName = products[0]?.collection || "";
      categories = new SvelteSet(products[0]?.category || []);
    });
  });

  const toggleProductView = (productId?: number) => {
    if (productId !== undefined) {
      selectedProduct = productId;
      showProduct = true;
    } else {
      showProduct = false;
    }
  };

  const cloneProduct = (productId: number) => {
    products.push($state.snapshot(products[productId]));
  };

  const selectProduct = (productId: number) => {
    selectedProduct = productId;
  };

  const deleteProduct = (productId: number) => {
    products.splice(productId, 1);
    selectProduct(0);
  };

  const createProducts = async () => {
    const toUpdate = products.filter((p) => {
      return (
        "id" in p &&
        !looseEq(
          p,
          prevProducts.find((pp) => "id" in pp && pp.id === p.id),
        )
      );
    }) as ProductMetadata[];
    const toCreate = products.filter((p) => !("id" in p));
    await user.createProducts(
      toCreate.map((p) => ({
        ...p,
        category,
        collection: collectionName,
      })),
    );
    await user.updateProducts(
      toUpdate.map((p) => ({
        ...p,
        category,
        collection: collectionName,
      })),
    );
  };

  const isValid = $derived.by(() => {
    return (
      collectionName !== "" &&
      category.length > 0 &&
      products.length > 0 &&
      products.every((p) => {
        try {
          assertIsValidMetadata(p);
          return true;
        } catch {}
        return false;
      })
    );
  });

  const showPreview = () => {
    hide = !hide;
  };
</script>

{#snippet head(toStore: boolean = true)}
  <div class="head" class:wpr={toStore}>
    <button
      onclick={() => (toStore ? goTo("/my-store") : (showProduct = false))}
      aria-labelledby={t.t("great_spare_frog_kiss")}
    >
      <i class="ri-arrow-left-long-line"></i>
      <span
        >{toStore
          ? t.t("ok_deft_poodle_gaze")
          : t.t("due_super_goldfish_swim")}</span
      >
    </button>
    <MultiSelect
      options={supportedLangs}
      bind:value={selectedLang}
      multiple={false}
      placeholder={t.t("weird_fuzzy_warbler_edit")}
      label={t.t("weird_fuzzy_warbler_edit")}
      bind:this={registry["lang_selector"]}
    >
      {#snippet valueRenderer(v)}
        {t.t(TranslatedLanguages[v])}
      {/snippet}
      {#snippet optionRenderer(v)}
        {t.t(TranslatedLanguages[v])}
      {/snippet}
    </MultiSelect>
  </div>
{/snippet}

<button class="showPreview" onclick={showPreview}>
  {#if hide}
    <i class="ri-eye-off-fill"></i>
  {:else}
    <i class="ri-eye-fill"></i>
  {/if}
</button>

<div class="form" class:hide>
  {#if !showProduct}
    <div class="collection">
      {@render head()}
      <Collapsable opened>
        {#snippet head()}
          <h3>{t.t("early_tangy_capybara_enchant")}</h3>
        {/snippet}
        <div class="wpr">
          <Input
            type="text"
            label={t.t("mealy_spare_thrush_gleam")}
            placeholder={t.t("mealy_spare_thrush_gleam")}
            bind:value={collectionName}
            bind:this={registry["collection_name"]}
          />
          <Categories bind:value={categories}></Categories>
        </div>
      </Collapsable>
      <Collapsable opened>
        {#snippet head()}
          <h3>{t.t("busy_happy_bird_treat")}</h3>
        {/snippet}
        <AttributesInCollection
          {onremove}
          {onswap}
          {onpush}
          {selectedLang}
          bind:attributes
        />
      </Collapsable>
      <Collapsable opened>
        {#snippet head()}
          <h3>{t.t("frail_livid_marmot_harbor")}</h3>
        {/snippet}
        <div class="products" bind:this={registry["products"]}>
          {#each products as product, i}
            <div
              class="preview"
              class:selected={selectedProduct === i}
              role="button"
              tabindex="0"
              onkeydown={() => {}}
              onclick={() => selectProduct(i)}
            >
              {#if product.gallery[t.lang][0]}
                <img src={product.gallery[t.lang][0]} alt="" />
              {:else}
                <i class="ri-image-line"></i>
              {/if}
              <h2>{product.title[t.lang]}</h2>
              <span>
                {Decimal.fromAtomics(product.price, 6).toString()} USDC
              </span>
              <ContextMenu>
                {#snippet opener({ get, set, ...props })}
                  {/*@ts-ignore*/ null}
                  <button
                    aria-label={t.t("direct_alive_ape_surge")}
                    bind:this={get, set}
                    {...props}
                  >
                    <i class="ri-more-line"></i>
                  </button>
                {/snippet}
                {#snippet options(close)}
                  <button onclick={() => toggleProductView(i)}>
                    <i class="ri-pencil-line"></i>
                    {t.t("sunny_lazy_puffin_devour")}
                  </button>
                  <button onclick={() => close() && cloneProduct(i)}>
                    <i class="ri-file-copy-line"></i>
                    {t.t("crisp_stout_elk_delight")}
                  </button>
                  {#if "id" in product}
                    <button
                      class="red"
                      onclick={() => close() && selectProduct(i)}
                    >
                      <i class="ri-eye-off-line"></i>
                      {t.t("active_tangy_wolf_hint")}
                    </button>
                  {:else}
                    <button
                      class="red"
                      onclick={() => close() && deleteProduct(i)}
                    >
                      <i class="ri-delete-bin-line"></i>
                      {t.t("grand_front_swan_hike")}
                    </button>
                  {/if}
                {/snippet}
              </ContextMenu>
            </div>
          {/each}
          <button
            onclick={addProduct}
            class="secondary-button"
            bind:this={registry["add_product"]}
          >
            <i class="ri-add-line"></i>
            {t.t("spry_cool_goose_sprout")}
          </button>
        </div>
      </Collapsable>
      <button
        onclick={createProducts}
        class="primary-button"
        bind:this={registry["add_product"]}
        disabled={!isValid || (!changed && products.some((p) => "id" in p))}
      >
        {#if products.some((p) => "id" in p)}
          {t.t("these_sound_skate_prosper")}
        {:else}
          {t.t("crisp_tough_mammoth_fear")}
        {/if}
      </button>
    </div>
  {:else}
    <div class="product" transition:fly={{ x: -100 }}>
      {@render head(false)}
      <label>
        <Checkbox value={products[selectedProduct].listed}></Checkbox>
        {t.t("ideal_whole_mole_win")}
      </label>
      <Gallery
        {selectedLang}
        bind:images={products[selectedProduct].gallery}
        bind:this={registry["gallery"]}
      ></Gallery>
      <TranslatableInput
        type="textarea"
        label={t.t("vivid_great_platypus_clasp")}
        {selectedLang}
        bind:value={products[selectedProduct].title}
        bind:this={registry["product_name"]}
      />
      <TranslatableInput
        type="autocomplete"
        label={t.t("alive_sad_grebe_beam")}
        {selectedLang}
        bind:value={products[selectedProduct].description}
        bind:this={registry["product_description"]}
      />
      <PriceInput bind:value={products[selectedProduct].price} />
      <AttributesInProduct
        bind:attributes={products[selectedProduct].attributes}
        {selectedLang}
      />
      <button
        class="secondary-button"
        onclick={() => toggleProductView()}
        bind:this={registry["close_product"]}
      >
        {t.t("actual_cool_racoon_laugh")}
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .showPreview {
    position: fixed;
    z-index: 2;
    right: 1rem;
    bottom: 1rem;
    background-color: var(--neutral-a2);
    color: var(--neutral-12);
    border: none;
    border-radius: 4px;
    font-size: 2rem;
    aspect-ratio: 1/1;
    @include media(">= phone") {
      display: none;
    }
  }
  .form {
    flex: 3;
    position: relative;
    display: flex;
    overflow: hidden;
    --parent-bg: var(--neutral-1);
    background-color: var(--parent-bg);
    border-right: 1px solid var(--neutral-6);
    transition: transform 200ms ease-in-out;
    &.hide {
      transform: translateX(-100%);
    }

    @include media(">= phone") {
      &.hide {
        transform: none;
      }
    }

    .wpr {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      gap: 1rem;
    }

    .head {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      button {
        align-self: flex-start;
        background-color: transparent;
        border: none;
        color: var(--neutral-11);
        cursor: pointer;
        span {
          text-decoration: underline;
          text-underline-offset: 0.4rem;
        }
        &:hover {
          color: var(--neutral-12);
        }
      }
    }

    .collection {
      display: flex;
      flex-direction: column;
      min-width: 100%;
      h3 {
        font-family: var(--font-2);
      }
    }

    .product {
      background-color: var(--parent-bg);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      z-index: 1;
      min-width: 100%;
      padding: 1rem;
      label {
        display: flex;
        align-items: center;
        width: max-content;
        gap: 0.5rem;
        cursor: pointer;
      }
    }

    .products {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;

      .preview {
        display: flex;
        width: 100%;
        gap: 1rem;
        align-items: center;
        border: 1px solid var(--neutral-6);
        padding: 0.5rem;
        border-radius: 3px;
        color: var(--neutral-12);
        background-color: var(--neutral-2);
        cursor: pointer;
        &:hover {
          border-color: var(--neutral-10);
        }
        &.selected {
          border-color: var(--main-8);
        }

        & > i,
        & > img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 2px;
          aspect-ratio: 1/1;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: var(--neutral-2);
        }
        h2 {
          flex: 1;
          height: 100%;
          font-size: 1.1rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        button {
          background-color: transparent;
          border: none;
          color: var(--neutral-11);
          outline: none;
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          &:hover {
            cursor: pointer;
            color: var(--neutral-12);
          }
        }
        .red {
          color: var(--red-11);
          &:hover {
            color: var(--red-10);
          }
        }
      }
    }
    .primary-button {
      margin: 1rem;
    }
  }
</style>

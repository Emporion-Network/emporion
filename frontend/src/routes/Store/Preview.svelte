<script lang="ts">
  import ImageSlider from "@/lib/ImageSlider.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  import Rendered from "@/routes/CreateProduct/Attributes/Rendered.svelte";
  import { Decimal } from "@cosmjs/math";
  import { user } from "@/stores/user.svelte";
  import Address from "@/lib/Address.svelte";
  import Rating from "@/lib/Rating.svelte";
  import ContextMenu from "@/lib/ContextMenu.svelte";
  import { bechToBech, type ProductMetadata } from "@common";
  import { getLocation } from "@/stores/location.svelte";
  import { onMount, untrack } from "svelte";
  const t = getTranslator();
  const l = getLocation();
  let selectedProduct = $state("");
  let products: ProductMetadata[] = $state([]);
  let selectedProductIdx = $state(-1);

  const fetchCollection = async (id: string) => {
    const req = await user.getCollection(id);
    const ec = await user.ec;
    let m: number[];
    if (req.error) return;
    products = await Promise.all(
      req.result.map(async (e) => {
        const p = await ec.getProduct({ id: e.id });
        if (!m) {
          m = await ec.getMark({ addr: bechToBech(e.seller, "juno") });
          return { ...e, mark: m, price: p.price };
        } else {
          return { ...e, price: p.price };
        }
      }),
    );
    selectedProductIdx = products.findIndex((p) => p.id == id);
  };
  let product = $derived(products[selectedProductIdx]);
  $effect(() => {
    selectedProductIdx;
    untrack(() => {
      if (products[selectedProductIdx]) {
        l.url.searchParams.set("p", products[selectedProductIdx].id);
        l.replace(l.url.href);
      }
    });
  });
  onMount(() => {
    const p = l.url.searchParams.get("p");
    if (!p) return;
    selectedProduct = p;
    fetchCollection(selectedProduct);
  });
</script>

<div class="preview">
  {#if product}
    <ImageSlider images={product.gallery[t.lang]} alt={product.title[t.lang]} />
    <div class="picker">
      <h1>{product.title[t.lang]}</h1>
      <Rating type="long" url="" nb_ratings={100} avg_rating={4.5}></Rating>
      <div class="link">
        <span>{t.t("upper_novel_shark_commend")}</span>
        <Address address={product.seller} />
        <ContextMenu>
          {#snippet opener({ get, set, ...props })}
            {/*@ts-ignore*/ null}
            <button
              class="ghost-button"
              aria-label={t.t("sour_curly_gorilla_edit")}
              bind:this={get, set}
              {...props}
              onclick={(e) => e.stopPropagation()}
            >
              <i class="ri-more-line"></i>
            </button>
          {/snippet}
          {#snippet options(close)}
            <div class="options">
              <button class="ghost-button">
                <i class="ri-share-forward-line"></i>
                {t.t("odd_sleek_penguin_adapt")}
              </button>
              <button class="ghost-button">
                <i class="ri-file-copy-line"></i>
                {t.t("candid_stout_lobster_stop")}
              </button>
              <button class="ghost-button red">
                <i class="ri-flag-fill"></i>
                {t.t("smug_elegant_cat_conquer")}
              </button>
            </div>
          {/snippet}
        </ContextMenu>
      </div>
      <div class="line"></div>
      <h2>
        {Decimal.fromAtomics(product.price, 6).toString()}
        <span>USDC</span>
      </h2>

      <p>{product.description[t.lang]}</p>

      <Rendered selectedLang={t.lang} {products} bind:selectedProductIdx
      ></Rendered>

      <button class="primary-button">
        {t.t("lofty_smart_okapi_bubble")}
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .preview {
    flex: 5;
    display: flex;
    align-items: flex-start;
    align-self: flex-start;
    position: sticky;
    top: 1rem;
    gap: 1rem;
    padding: 1rem;
    z-index: -1;
    .options {
      background-color: var(--neutral-1);
      align-items: flex-start;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
    }
    .picker {
      width: 40%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      .link {
        font-weight: 500;
        :global(.address) {
          color: var(--main-10);
          text-decoration: underline;
        }
      }
      h1 {
        line-height: 1.1em;
        font-family: var(--font-2);
        font-weight: 900;
        font-size: 2.4rem;
      }
      h2 {
        font-weight: 900;
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 0.1rem;
        font-size: 2rem;
        margin-top: 1rem;
        span {
          font-size: 0.9rem;
          transform: translateY(25%);
        }
      }
      .line {
        border-bottom: 1px solid var(--neutral-6);
      }
      p {
        line-height: 1.2em;
      }
    }
    @include media("<= phone") {
      position: absolute;
      flex-direction: column;
      :global(.gellery) {
        position: relative;
        top: 0;
      }
      .picker {
        width: 100%;
      }
    }
  }
</style>

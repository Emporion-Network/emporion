<script lang="ts">
  import ImageSlider from "@/lib/ImageSlider.svelte";
  import type { SupportedLanguage } from "@/stores/translate.svelte";
  import Rendered from "./Attributes/Rendered.svelte";
  import type { Product } from "./Form.svelte";
  import { Decimal } from "@cosmjs/math";
  import { user } from "@/stores/user.svelte";
  import Address from "@/lib/Address.svelte";
  import Rating from "@/lib/Rating.svelte";

  let {
    selectedLang,
    products,
    selectedProduct = $bindable(),
  }: {
    products: Product[];
    selectedLang: SupportedLanguage;
    selectedProduct: number;
  } = $props();

  let product = $derived(products[selectedProduct]);
</script>

<div class="preview">
  {#if product}
    <ImageSlider
      images={product.gallery[selectedLang]}
      alt={product.title[selectedLang]}
    />
    <div class="picker">
      {#if product.title[selectedLang]}
        <h1>{product.title[selectedLang]}</h1>
      {:else}
        <div class="placeholder"></div>
      {/if}
      <Rating type="long" url="" nb_ratings={100} avg_rating={4.5}></Rating>
      <div class="link">
        <span>{"Seller:"}</span>
        <Address address={user.address!} />
      </div>
      <div class="line"></div>
      <h2>
        {Decimal.fromAtomics(product.price, 6).toString()}
        <span>USDC</span>
      </h2>

      <p>{product.description[selectedLang]}</p>

      <Rendered
        {selectedLang}
        {products}
        bind:selectedProductId={selectedProduct}
      ></Rendered>

      <button class="primary-button">
        {"Add to cart"}
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .preview {
    flex: 5;
    display: flex;
    align-items: flex-start;
    position: sticky;
    top: 1rem;
    align-self: flex-start;
    gap: 1rem;
    padding: 1rem;
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
  }
</style>

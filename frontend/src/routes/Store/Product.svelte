<script lang="ts">
  import Rating from "@/lib/Rating.svelte";
  import type { WithSkeleton } from "@/lib/utils";
  import { getTranslator } from "@/stores/translate.svelte";
  import { Decimal } from "@cosmjs/math";
  import type { ProductMetadata } from "@common";
  import Address from "@/lib/Address.svelte";
  import { getLocation } from "@/stores/location.svelte";
  const t = getTranslator();
  const l = getLocation();

  let props: WithSkeleton<{
    product: ProductMetadata & { mark: number[] };
  }> = $props();

  const getRating = (n: number[]) => {
    const nb_ratings = n.reduce((acc, r) => acc + r, 0);
    return {
      nb_ratings,
      avg_rating:
        nb_ratings > 0
          ? n.reduce((acc, r, i) => acc + r * i, 0) / nb_ratings
          : 0,
    };
  };

  const addToCart = (product: ProductMetadata) => () => {
    window.dispatchEvent(new CustomEvent("cart-push", { detail: product }));
  };
</script>

<div class="product">
  {#if props.skeleton}
    <div class="skeleton-img skeleton"></div>
    <div class="info">
      <div class="skeleton-title">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
      <Rating skeleton />
      <button class="skeleton-button" aria-label={""}>
        <i class="ri-loader-4-line"></i>
      </button>
    </div>
  {/if}
  {#if !props.skeleton}
    {@const p = props.product}
    {@const rating = getRating(p.mark)}
    <img src={p.gallery[t.lang][0]} alt={p.title[t.lang]} />
    <div class="info">
      <div class="title">
        <a
          href={`/product?p=${p.id}`}
          onclick={() => l.goTo(`/product?p=${p.id}`)}
          ><h2>{p.title[t.lang]}</h2></a
        >
        <h3>{Decimal.fromAtomics(p.price, 6)} USDC</h3>
        <Address address={p.seller} />
        <Rating type="long" {...rating} />
      </div>
      <button class="primary-accent-button" onclick={addToCart(p)}>
        Add to cart
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .product {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--neutral-6);
    border-radius: 5px;
    overflow: hidden;
    .skeleton-img {
      width: 100%;
      aspect-ratio: 1/1;
      background-color: var(--neutral-2);
    }
    .skeleton-title {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      div {
        min-height: 1.3rem;
        margin-bottom: 0.5rem;
        border-radius: 3px;
        &:nth-of-type(2) {
          width: 63%;
        }
      }
    }
    .info {
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: var(--neutral-3);
      padding: 1rem;
      gap: 0.5rem;
      flex: 1;
      button {
        margin-top: auto;
      }
    }
    img {
      width: 100%;
      aspect-ratio: 1/1;
      object-fit: contain;
      padding: 0.5rem;
    }
    h2 {
      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>

<script lang="ts">
  import type { ProductMetadata } from "@common";
  import { Storage } from "@/stores/localStorage.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  import { Decimal, Uint32 } from "@cosmjs/math";
  import { on } from "svelte/events";
  import { onMount } from "svelte";
  const cart = new Storage<ProductMetadata[]>("cart", []);
  let show = $state(false);
  let t = getTranslator();
  let grouped = $derived.by(() => {
    return cart.value.reduce(
      (acc, p) => {
        if (acc[p.seller]) {
          acc[p.seller].push({
            ...p,
            quantity: 1,
          });
          return acc;
        } else {
          acc[p.seller] = [
            {
              ...p,
              quantity: 1,
            },
          ];
        }
        return acc;
      },
      {} as Record<string, (ProductMetadata & { quantity: number })[]>,
    );
  });
  onMount(() => {
    on(window, "cart-push", (e: Event) => {
      const p = (e as CustomEvent).detail as ProductMetadata;
      cart.value.push(p);
    });
    on(window, "cart-open", (e: Event) => {
      show = true;
    });
  });
</script>

<div class="cart" class:show>
  <div class="content">
    {#each Object.entries(grouped) as [seller, products]}
      <div class="seller">
        <h2>{seller}</h2>
        <div class="products">
          {#each products as p}
            <div class="product">
              <img src={p.gallery[t.lang][0]} alt="" />
              <h3>{p.title}</h3>
              <div class="info">
                <div class="price">
                  {Decimal.fromAtomics(p.price, 6).toString()}
                </div>
                <div class="quantity">
                  <button>-</button>
                  <span>{p.quantity}</span>
                  <button>+</button>
                </div>
                <div class="remove">
                  <button>Remove</button>
                </div>
              </div>
            </div>
          {/each}
        </div>
        <div class="total">
          <h3>
            Total: {products.reduce(
              (acc, p) =>
                acc.plus(
                  Decimal.fromAtomics(p.price, 6).multiply(
                    Uint32.fromString(p.quantity.toString()),
                  ),
                ),
              Decimal.zero(6),
            )}
          </h3>
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .cart {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 5;
    background-color: var(--black-a11);
    width: 100vw;
    height: 100vh;
    display: flex;
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease-in-out;
    &.show {
      opacity: 1;
      pointer-events: all;
      .content {
        transform: translateX(0);
      }
    }
    .content {
      width: 40vw;
      height: 100vh;
      background-color: var(--neutral-2);
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      margin-left: auto;
      transform: translateX(100%);
      transition: transform 200ms ease-in-out;
    }
  }
</style>

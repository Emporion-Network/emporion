<script lang="ts">
  import type { ProductMetadata } from "@common";
  import { getTranslator } from "@/stores/translate.svelte";
  import { Decimal, Uint32 } from "@cosmjs/math";
  import { on } from "svelte/events";
  import { onMount } from "svelte";
  import Address from "./Address.svelte";
  import { user } from "@/stores/user.svelte";
  import Range from "./Range.svelte";
  import PostalAddressForm from "./PostalAddressForm.svelte";
  import type { EmporionClient } from "@ts-client/Emporion.client";

  let show = $state(false);
  let t = getTranslator();
  let grouped = $derived.by(() => {
    return user.cart.value.reduce(
      (acc, p) => {
        if (acc[p.seller]) {
          let i = acc[p.seller].findIndex((x) => x.id == p.id);
          if (i != -1) {
            acc[p.seller][i].quantity++;
            return acc;
          }
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
  let total = $derived.by(() => {
    return user.cart.value.reduce((acc, c) => {
      return acc.plus(Decimal.fromAtomics(c.price, 6));
    }, Decimal.zero(6));
  });
  let fairSplits: Record<string, number[]> = $state({});
  const getfairSplit = (addr: string) => () => {
    if (fairSplits[addr] == undefined) {
      fairSplits[addr] = [0.5];
    }
    return fairSplits[addr];
  };
  const setFairSplit = (addr: string) => (v: number[]) => {
    fairSplits[addr] = v;
  };

  onMount(() => {
    on(window, "cart-push", (e: Event) => {
      const p = (e as CustomEvent).detail as ProductMetadata;
      user.cart.value.push(p);
    });
    on(window, "cart-open", (e: Event) => {
      show = true;
    });
  });
  const remove = (id: string) => () => {
    const p = user.cart.value.findIndex((x) => x.id == id)!;
    user.cart.value.splice(p, 1);
  };
  const add = (id: string) => () => {
    const p = user.cart.value.find((x) => x.id == id)!;
    user.cart.value.push(p);
  };
  let postalAddress = $state({
    name: "",
    postalAddress: "",
  });

  const valid = () => {
    return (
      Object.keys(grouped).length > 0 &&
      postalAddress.name !== "" &&
      postalAddress.postalAddress !== "" &&
      Decimal.fromAtomics(user.bank.accepted, 6).isGreaterThan(total)
    );
  };
  const pay = async () => {
    const ec = (await user.ec) as EmporionClient;
    const resp = await ec.createOrder(
      {
        orders: Object.entries(grouped).map(([addr, p]) => {
          return {
            product_ids: p
              .map((p) => Array.from({ length: p.quantity }, () => p.id))
              .flat(),
            loss_distribution_ratio: fairSplits[addr][0].toFixed(3),
          };
        }),
      },
      "auto",
      "",
      [
        {
          denom: user.acceptedDenom,
          amount: total.atomics,
        },
      ],
    );
    const ids = resp.events
      .find((e) => e.type == "wasm")
      ?.attributes.find((a) => a.key == "order_ids")
      ?.value.split(", ");
    await Promise.all(
      ids?.map(async (id) => {
        await user.createOrderData({
          id,
          postalAddress,
        });
      }) || [],
    );
    user.cart.value = [];
  };
</script>

<div class="cart" class:show>
  <div class="content">
    <h1>
      {t.t("entrance_affect_advertising_break")}
      <button
        aria-labelledby="Close cart"
        class="ghost-button"
        onclick={() => (show = false)}
      >
        <i class="ri-close-line"></i>
      </button>
    </h1>
    <PostalAddressForm
      bind:name={postalAddress.name}
      bind:postalAddress={postalAddress.postalAddress}
    />
    {#each Object.entries(grouped) as [seller, products]}
      {@const total = products.reduce(
        (acc, p) =>
          acc.plus(
            Decimal.fromAtomics(p.price, 6).multiply(
              Uint32.fromString(p.quantity.toString()),
            ),
          ),
        Decimal.zero(6),
      )}
      <div class="seller">
        <h2>
          {t.t("brilliant_vigorous_salty_state")}<Address address={seller} />
        </h2>
        <div class="products">
          {#each products as p}
            <div class="product">
              <img src={p.gallery[t.lang][0]} alt="" />
              <div class="wpr">
                <h3>{p.title[t.lang]}</h3>
                <div class="price">
                  {Decimal.fromAtomics(p.price, 6).toString()} USDC
                </div>
              </div>
              <div class="quantity">
                <button class="primary-button" onclick={remove(p.id)}>-</button>
                <span>{p.quantity}</span>
                <button class="primary-button" onclick={add(p.id)}>+</button>
              </div>
            </div>
          {/each}
        </div>
        <h3 class="total">
          <span>{t.t("knee_judge_devil_expert")}</span>
          <span>
            {total} USDC
          </span>
        </h3>
        <h3 class="total">
          <span>{t.t("mysterious_dance_wicked_phrase")}</span>
          <span>
            ≈ {(total.toFloatApproximation() * fairSplits[seller][0]).toFixed(
              2,
            )}
            USDC
          </span>
        </h3>
        <Range bind:value={getfairSplit(seller), setFairSplit(seller)}>
          {#snippet tooltip(v)}
            {(total.toFloatApproximation() * v).toFixed(2)} USDC
          {/snippet}
        </Range>
        <p class="info">
          {t.t("dig_those_coarse_machine")}
        </p>
      </div>
    {/each}
    <button class="primary-button" disabled={!valid()} onclick={pay}>
      {t.t("beginning_organization_truth_breakfast")}
    </button>
  </div>
</div>

<style lang="scss">
  @use "../mixins" as *;
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
    overscroll-behavior: contain;
    @include media("<=phone") {
      &.show {
        .content {
          width: 100vw;
        }
      }
    }
    h1 {
      display: flex;
      button {
        margin-left: auto;
      }
    }
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
      --parent-bg: var(--neutral-2);
      background-color: var(--parent-bg);
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-left: auto;
      transform: translateX(100%);
      transition: transform 200ms ease-in-out;
      overflow-y: auto;
    }
    .seller {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      :global(.range) {
        margin-top: 1rem;
        max-width: unset;
        height: 10px;
        background: linear-gradient(
          to right,
          var(--red-10),
          var(--green-10),
          var(--red-10)
        );
      }

      .product {
        display: flex;
        justify-content: flex-start;
        gap: 1rem;
        .wpr {
          flex: 1;
        }
        img {
          width: 70px;
          aspect-ratio: 1/1;
          object-fit: contain;
        }
        .quantity {
          align-self: center;
          display: flex;
          button {
            aspect-ratio: 1;
            height: 2rem;
            padding: 0 !important;
          }
          span {
            display: flex;
            min-width: 3rem;
            text-align: center;
            justify-content: center;
            align-items: center;
          }
        }
      }

      .products {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
      }
      .total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        span:nth-child(2) {
          font-family: var(--font-mono);
        }
      }
      .info {
        background-color: var(--orange-3);
        padding: 0.5rem;
        border: 1px solid var(--orange-6);
        color: var(--orange-12);
        border-radius: 3px;
        margin-bottom: 1rem;
        margin-top: 1rem;
      }
    }
  }
</style>

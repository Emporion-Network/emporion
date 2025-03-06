<script lang="ts">
  import Address from "@/lib/Address.svelte";
  import { bechToBech } from "@/lib/utils";
  import { getTranslator, translateDate } from "@/stores/translate.svelte";
  import { user } from "@/stores/user.svelte";
  import type { ProductMetadata } from "@common";
  import type { Order } from "@ts-client/Emporion.types";
  import { Decimal } from "@cosmjs/math";
  import ContextMenu from "@/lib/ContextMenu.svelte";

  let t = getTranslator();
  let orders: (Order & {
    products: ProductMetadata[];
    open: boolean;
  })[] = $state([]);
  const loadOrders = async () => {
    if (!user.address) return;
    const ec = await user.ec;
    const o = await ec.listOrdersForUser({
      addr: bechToBech(user.address, "juno"),
      pagination: {},
    });
    orders = await Promise.all(
      o.map(async (o) => {
        const pdts = (
          await Promise.all(o.cart.map(async (p) => await user.getProduct(p)))
        )
          .filter((e) => !e.error)
          .map((e) => e.result);
        return {
          ...o,
          products: pdts,
          open: false,
        };
      }),
    );
  };

  type Status = Order["status"];
  const statusToColor: { [key in Status]: string } = {
    accepted: "blue",
    pending: "orange",
    cancelled: "purple",
    completed: "green",
    disputed: "red",
  };

  $effect(() => {
    if (user.address) {
      loadOrders();
    }
  });
</script>

<div class="orders">
  <h2>{t.t("mushy_due_jackdaw_pride")}</h2>
  {#if orders.length > 0}
    <div class="table">
      <div class="head">
        <span>Order id</span>
        <span>Buyer</span>
        <span>Date</span>
        <span>Status</span>
        <span>Total</span>
        <span></span>
      </div>
      {#each orders as o}
        <div
          class="order"
          role="button"
          tabindex="0"
          onkeydown={() => {}}
          onclick={() => (o.open = !o.open)}
        >
          <div class="quickView">
            <span>#{o.id.padStart(6, "0")}</span>
            <Address address={o.buyer} />
            <span>{translateDate(t.lang, new Date(Number(o.created_at)))}</span>
            <span>
              <span class="status {statusToColor[o.status]}">
                {o.status}
              </span>
            </span>
            <span>{Decimal.fromAtomics(o.total, 6)} USDC</span>
            <ContextMenu>
              {#snippet opener({ get, set, ...props })}
                {/*@ts-ignore*/ null}
                <button
                  aria-label={t.t("direct_alive_ape_surge")}
                  class="edit"
                  bind:this={get, set}
                  {...props}
                >
                  <i class="ri-more-line"></i>
                </button>
              {/snippet}
              {#snippet options()}
                <button class="ctxMenu"> Accept order </button>
                <button class="ctxMenu"> Reject order </button>
              {/snippet}
            </ContextMenu>
          </div>
          <div class="grid" class:open={o.open}>
            {#each [...o.products, ...o.products, ...o.products] as p}
              <div class="product">
                <img src={p.gallery[t.lang][0]} alt="" />
                <div class="attributes">
                  <h3>{p.title[t.lang]}</h3>
                  {#each p.attributes as a}
                    <div>
                      <span>{a.trait_type}</span>
                      <span>
                        {#if a.display_type == "buttons" || a.display_type === "select"}
                          {a.value[t.lang]}
                        {:else if a.display_type === "color" || a.display_type == "image_buttons"}
                          {a.label[t.lang]}
                        {:else if a.display_type == "checkbox"}
                          {a.value}
                        {/if}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p>{t.t("this_left_vulture_blink")}</p>
  {/if}
</div>

<style lang="scss">
  @use "../../mixins" as *;
  h2 {
    margin-bottom: 0.5rem;
  }
  p {
    padding: 2rem 1rem;
    background-color: var(--neutral-2);
    color: var(--neutral-11);
    text-align: center;
    margin-bottom: 1rem;
  }
  .status {
    padding: 0 0.5rem;
    border-radius: 1rem;
    border-width: 1px;
    border-style: solid;

    &.green {
      background-color: var(--green-4);
      border-color: var(--green-6);
      color: var(--green-12);
    }
    &.orange {
      background-color: var(--orange-4);
      border-color: var(--orange-6);
      color: var(--orange-11);
    }
    &.blue {
      background-color: var(--blue-4);
      border-color: var(--blue-6);
      color: var(--blue-11);
    }
    &.purple {
      background-color: var(--purple-4);
      border-color: var(--purple-6);
      color: var(--purple-11);
    }
    &.red {
      background-color: var(--red-4);
      border-color: var(--red-6);
      color: var(--red-11);
    }
  }
  .table {
    display: grid;
    grid-template-columns: repeat(5, 1fr) 2rem;
    --parent-bg: var(--neutral-1);
    .head {
      display: contents;
      span {
        display: flex;
        font-weight: 900;
        border-bottom: 1px solid var(--neutral-6);
        height: 2rem;
        &:first-of-type {
          padding-left: 1rem;
        }
      }
    }
    .ctxMenu {
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
    .order {
      display: contents;
      &:hover {
        .grid {
          background-color: var(--neutral-a2);
          cursor: pointer;
        }
        .quickView {
          :global(.address) {
            background-color: var(--neutral-a2);
            cursor: pointer;
          }
          & > span,
          .edit {
            background-color: var(--neutral-a2);
            cursor: pointer;
          }
        }
      }
      .quickView {
        display: contents;
        & > *:nth-child(1) {
          padding-left: 1rem;
        }
        :global(.address) {
          height: 3rem;
        }
        :global(.address span) {
          align-self: center;
        }
        & > span {
          display: flex;
          height: 3rem;
          align-items: center;
        }
        .edit {
          background-color: transparent;
          color: white;
          border: none;
          padding-right: 1rem;
        }
      }
      .grid {
        padding: 1rem;
        display: none;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        grid-column: 1/-1;
        &.open {
          display: grid;
        }
        .product {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 3px;
          gap: 1rem;
          cursor: pointer;
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
          .attributes {
            display: flex;
            flex-direction: column;
          }
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
  }
</style>

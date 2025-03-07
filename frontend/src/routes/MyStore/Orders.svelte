<script lang="ts">
  import Address from "@/lib/Address.svelte";
  import { bechToBech, copyToClipboard } from "@/lib/utils";
  import { getTranslator, translateDate } from "@/stores/translate.svelte";
  import { user } from "@/stores/user.svelte";
  import type { PostalAddress, ProductMetadata } from "@common";
  import type { Order } from "@ts-client/Emporion.types";
  import { Decimal } from "@cosmjs/math";
  import ContextMenu from "@/lib/ContextMenu.svelte";
  import type { EmporionClient } from "@ts-client/Emporion.client";

  type AggragatedOrder = Order & {
    products: (ProductMetadata & { qty: number })[];
    open: boolean;
    trackingNumber: string;
    nbItems: number;
    postalAddress: PostalAddress;
  };
  let t = getTranslator();
  let orders: AggragatedOrder[] = $state([]);
  const loadOrders = async () => {
    if (!user.address) return;
    const ec = await user.ec;
    const o = await ec.listOrdersForUser({
      addr: bechToBech(user.address, "juno"),
      pagination: {},
    });
    orders = await Promise.all(
      o.map(async (o) => {
        const map = new Map<string, ProductMetadata & { qty: number }>();
        const pdts = await Promise.all(
          o.cart.map(async (p) => await user.getProduct(p)),
        );
        const orderData = await user.getOrderData(o.id);
        if (orderData.error) {
          throw Error(`Could not load data`);
        }
        pdts
          .filter((e) => !e.error)
          .map((e) => e.result)
          .forEach((p) => {
            const e = map.get(p.id);
            if (e) {
              e.qty++;
            } else {
              map.set(p.id, { ...p, qty: 1 });
            }
          });
        return {
          ...o,
          nbItems: pdts.length,
          products: [...map.values()],
          open: false,
          trackingNumber: orderData.result.trackingNumber,
          postalAddress: orderData.result.postalAddress,
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

  const statusToLabel: { [key in Status]: string } = {
    accepted: t.t("independent_playful_towel_idiotic"),
    pending: t.t("trim_dreary_quote_till"),
    cancelled: t.t("recommendation_belated_woman_light"),
    completed: t.t("steal_place_demanding_green"),
    disputed: t.t("death_worrisome_late_optimal"),
  };

  const acceptOrder = (order: Order) => async (e: MouseEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const ec = (await user.ec) as EmporionClient;
    try {
      await ec.acceptOrder({ orderId: order.id });
      order.status = "accepted";
    } catch (e) {}
  };
  const rejectOrder = (order: Order) => async (e: MouseEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const ec = (await user.ec) as EmporionClient;
    try {
      await ec.cancelOrder({ orderId: order.id });
      order.status = "cancelled";
    } catch (e) {}
  };

  const updateTrackingNb = (o: AggragatedOrder) => async () => {
    await user.setTrackingNumber({
      id: o.id,
      trackingNumber: o.trackingNumber,
    });
  };

  const copyText = (text: string) => (e: MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(text);
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
        <span>Tracking Nb.</span>
        <span>Nb. items</span>
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
            <Address address={bechToBech(o.buyer, "cosmos")} />
            <span>{translateDate(t.lang, new Date(Number(o.created_at)))}</span>
            <span>
              <span class="status {statusToColor[o.status]}">
                {statusToLabel[o.status]}
              </span>
            </span>
            <span class="tracking">
              <input
                class="trackingNb"
                type="text"
                onclick={(e) => e.stopPropagation()}
                bind:value={o.trackingNumber}
                onchange={updateTrackingNb(o)}
                placeholder="Tracking nb"
              />
              <i class="ri-pencil-line"></i>
            </span>
            <span>
              {o.nbItems}
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
                {#if o.status == "pending"}
                  <button class="ctxMenu" onclick={acceptOrder(o)}>
                    Accept order
                  </button>
                  <button class="ctxMenu" onclick={rejectOrder(o)}>
                    Reject order
                  </button>
                {/if}
                {#if o.status == "accepted"}
                  <button class="ctxMenu" onclick={rejectOrder(o)}>
                    Dispute order
                  </button>
                {/if}
              {/snippet}
            </ContextMenu>
          </div>
          <div class="grid" class:open={o.open}>
            <div class="info">
              <div class="postalAddress">
                <h3>
                  {t.t("fitting_turbulent_quirky_education")}
                  <i class="ri-truck-fill"></i>
                </h3>
                <div>
                  <span>{t.t("far_friendship_untimely_text")}: </span>
                  <button
                    class="ghost-button"
                    onclick={copyText(o.postalAddress.name)}
                    aria-labelledby={t.t("exam_darling_mealy_steel")}
                  >
                    <i class="ri-file-copy-line"></i>
                  </button>
                  <span>{o.postalAddress.name}</span>
                </div>
                <div>
                  <span>{t.t("discount_admirable_plant_complex")}:</span>
                  <button
                    class="ghost-button"
                    onclick={copyText(o.postalAddress.postalAddress)}
                    aria-labelledby={t.t("bouncy_remote_candle_new")}
                  >
                    <i class="ri-file-copy-line"></i>
                  </button>
                  <span>{o.postalAddress.postalAddress}</span>
                </div>
              </div>
              <div class="buttons">
                {#if o.status == "pending"}
                  <button class="primary-button">Accept order</button>
                  <button class="primary-button">Reject order</button>
                {/if}
                {#if o.status === "accepted"}
                  <button class="primary-button">Dispute order</button>
                {/if}
              </div>
            </div>
            {#each o.products as p}
              <div class="product">
                <img src={p.gallery[t.lang][0]} alt="" />
                <div class="attributes">
                  <h3>{p.qty}x {p.title[t.lang]}</h3>
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
    grid-template-columns: repeat(7, 1fr) 2rem;
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
        .tracking {
          display: flex;
          padding-right: 1rem;
          i {
            color: var(--neutral-10);
            margin-left: -1.5rem;
            pointer-events: none;
          }
          .trackingNb {
            outline: none;
            background-color: var(--neutral-3);
            color: var(--neutral-12);
            border-radius: 3px;
            border: none;
            padding: 0.1rem;
            padding-left: 0.5rem;
            flex: 1;
            min-width: none;
            border: 1px solid transparent;
            &:focus {
              border: 1px solid var(--main-10);
            }
          }
        }
      }
      .grid {
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        grid-column: 1/-1;
        overflow-y: hidden;
        height: 0;
        border-bottom: 1px solid var(--neutral-6);
        padding: 0 1rem;
        .info {
          grid-column: 1/-1;
          display: flex;
          .postalAddress {
            display: flex;
            flex-direction: column;
            flex: 1;
            div {
              display: flex;
              button {
                margin-left: auto;
                margin-right: 0.5rem;
              }
            }
          }
          .buttons {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            gap: 1rem;
          }
        }
        &.open {
          height: max-content;
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

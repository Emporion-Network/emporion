<script lang="ts">
  import Address from "@/lib/Address.svelte";
  import { bechToBech } from "@/lib/utils";
  import { getTranslator } from "@/stores/translate.svelte";
  import { user } from "@/stores/user.svelte";
  import type { Rating } from "@ts-client/Emporion.types";
  import { onMount } from "svelte";
  let t = getTranslator();
  let ratings: Rating[] = $state([]);
  const loadReviews = async () => {
    if (!user.address) return;
    const ec = await user.ec;
    let r = await ec.listRatingsFromUser({
      addr: bechToBech(user.address!, "juno"),
      pagination: {},
    });
    console.log(r);
    ratings = r;
  };

  $effect(() => {
    if (user.address) {
      loadReviews();
    }
  });
</script>

<div class="orders">
  <h2>{t.t("alert_tidy_horse_buy")}</h2>
  {#if ratings.length > 0}
    <div class="table">
      {#each ratings as r}
        <div>
          <span>#{r.order_id.padStart(8, "0")}</span>
          <Address address={r.rater} />
        </div>
        <p>{r.comment}</p>
      {/each}
    </div>
  {:else}
    <p class="info">{t.t("stock_noble_kestrel_assure")}</p>
  {/if}
</div>

<style lang="scss">
  .info {
    padding: 2rem 1rem;
    background-color: var(--neutral-2);
    color: var(--neutral-11);
    text-align: center;
    margin-bottom: 1rem;
  }
</style>

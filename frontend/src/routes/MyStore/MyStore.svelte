<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import Collections from "./Collections.svelte";
  import Orders from "./Orders.svelte";
  import Address from "@/lib/Address.svelte";
  import Rating from "@/lib/Rating.svelte";
  import Reviews from "./Reviews.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  let t = getTranslator()
</script>

<div class="my-store">
  <div class="head">
    {#if user.address}
      <div class="wpr">
        <h1>
          <span>{t.t("born_icy_goldfish_heart")}</span>
          <Address address={user.address!}></Address>
          <span>👋</span>
        </h1>
        <Rating type="long" nb_ratings={0} avg_rating={0}></Rating>
        <div class="numbers">
          <div class="number">
            <span>{t.t("chunky_gray_ox_jest")}</span>
            <span>$0</span>
          </div>
          <div class="number">
            <span>{t.t("heroic_same_dove_delight")}</span>
            <span>0</span>
          </div>
          <div class="number">
            <span>{t.t("these_east_parrot_zap")}</span>
            <span>0</span>
          </div>
        </div>
      </div>
      <div class="rating-detail">
        {#await user.getRating(user.address) then r}
          <div class="avg">
            {(r.reduce((a, b, i) => a + b * i, 0) / 5).toFixed(2)}
          </div>
          <div>
            <Rating type="long" nb_ratings={r[0]} avg_rating={0}></Rating>
          </div>
          <div>
            <Rating type="long" nb_ratings={r[1]} avg_rating={1}></Rating>
          </div>
          <div>
            <Rating type="long" nb_ratings={r[2]} avg_rating={2}></Rating>
          </div>
          <div>
            <Rating type="long" nb_ratings={r[3]} avg_rating={3}></Rating>
          </div>
          <div>
            <Rating type="long" nb_ratings={r[4]} avg_rating={4}></Rating>
          </div>
          <div>
            <Rating type="long" nb_ratings={r[5]} avg_rating={5}></Rating>
          </div>
        {/await}
      </div>
    {/if}
  </div>
  <Orders />
  <Collections />
  <Reviews />
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .my-store {
    margin: 0 5%;
    padding-top: 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    @include media('<= phone'){
      .head{
        flex-direction: column;
        .numbers{
          flex-direction: column;
        }
        .rating-detail{
          width: 100%;
          justify-content: center;
          align-items: center;
        }
      }
    }
    .head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    .wpr {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex: 1;
    }
    .numbers {
      display: flex;
      gap: 1rem;
      flex: 1;
      width: 100%;
      .number {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        gap: 1rem;
        background-color: var(--neutral-2);
        flex: 1;
        span {
          &:first-child {
            font-size: 0.9rem;
            color: var(--neutral-11);
            white-space: nowrap;
          }
          &:last-child {
            font-size: 2rem;
            font-weight: bold;
          }
        }
      }
    }
    .rating-detail {
      padding: 1rem;
      background-color: var(--neutral-2);
      width: max-content;
      flex-direction: column;
      display: flex;
      font-size: 0.9rem;
      border-radius: 3px;
      .avg {
        font-size: 3rem;
        line-height: 3rem;
        font-weight: 900;
        text-align: center;
        margin-bottom: 1rem;
      }
    }
  }
</style>

<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import Collections from "./Collections.svelte";
  import Orders from "./Orders.svelte";
  import Address from "@/lib/Address.svelte";
  import Rating from "@/lib/Rating.svelte";
</script>

<div class="my-store">
  <div class="head">
    {#if user.address}
      <div>
        <h1>
          <span>Hello,</span>
          <Address address={user.address!}></Address>
          <span>👋</span>
        </h1>
        <Rating type="long" nb_ratings={0} avg_rating={0}></Rating>
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
  <Orders></Orders>
  <Collections></Collections>
</div>

<style lang="scss">
  .my-store {
    margin: 0 5%;
    padding-top: 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    .head {
      display: flex;
      justify-content: space-between;
    }
    .rating-detail {
      padding: 1rem;
      background-color: var(--neutral-3);
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

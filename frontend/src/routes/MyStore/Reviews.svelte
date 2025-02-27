<script>
  import { user } from "@/stores/user.svelte";
</script>

<div class="orders">
  <h2>Reviews</h2>
  {#if [].length > 0}
    <div class="table"></div>
  {:else}
    <p>You have no reviews yet.</p>
  {/if}
</div>

<style lang="scss">
  p {
    padding: 2rem 1rem;
    background-color: var(--neutral-2);
    color: var(--neutral-11);
    text-align: center;
    margin-bottom: 1rem;
  }
</style>

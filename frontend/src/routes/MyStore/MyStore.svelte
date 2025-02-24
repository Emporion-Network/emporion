<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import Collections from "./Collections.svelte";
</script>

<div class="my-store">
  <div class="profile"></div>
  <div class="orders">
    <h2>Orders</h2>
    <div class="table"></div>
  </div>
  <Collections></Collections>
</div>

<style lang="scss">
  .my-store {
    margin: 0 5%;
    padding-top: 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>

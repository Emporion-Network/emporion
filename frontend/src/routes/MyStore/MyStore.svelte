<script lang="ts">
  import Collections from "./Collections.svelte";
  import Orders from "./Orders.svelte";
</script>

<div class="my-store">
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
  }
</style>

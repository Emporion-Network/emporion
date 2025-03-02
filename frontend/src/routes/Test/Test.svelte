<script lang="ts">
  import Range from "@/lib/Range.svelte";
  let v = [0, 0.5, 1];
</script>

<div class="page">
  <input type="range" />
  <Range bind:value={v}>
    {#snippet tooltip(p)}
      {Math.floor(p * 100)}%
    {/snippet}
  </Range>
</div>

<style lang="scss">
  .page {
    display: flex;
    height: 100vh;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 3rem;
  }
</style>

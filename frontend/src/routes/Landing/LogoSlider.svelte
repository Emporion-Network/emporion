<script lang="ts">
  import Noble from "@/assets/noble.svelte";
  import Axelar from "@/assets/axelar.svelte";
  import Cosmos from "@/assets/cosmos.svelte";
  import Persistence from "@/assets/persistence.svelte";
  import Evmos from "@/assets/evmos.svelte";
  import Osmosis from "@/assets/osmosis.svelte";
  import Juno from "@/assets/juno.svelte";
  import Slider from "@/lib/Slider.svelte";
</script>

<Slider>
  <div><Juno /></div>
  <div><Osmosis /></div>
  <div><Noble /></div>
  <div><Axelar /></div>
  <div><Cosmos /></div>
  <div><Persistence /></div>
  <div><Evmos /></div>
</Slider>

<style lang="scss">
  div {
    min-width: max-content;
    :global(svg) {
      height: 40px;
      width: auto;
    }
    :global(svg path) {
      fill: rgba(255, 255, 255, 0.8);
    }
  }
</style>

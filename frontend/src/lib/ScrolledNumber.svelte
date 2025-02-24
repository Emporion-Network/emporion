<script lang="ts">
  import { intersect } from "./actions.svelte";

  let { n, "font-size": fsz = "inherit" }: { n: string; "font-size"?: string } =
    $props();
  let tgt = $state(n);
  const set = () => {
    tgt = n;
  };
  const reset = () => {
    tgt = n
      .split("")
      .map((e) => "0")
      .join("");
  };
</script>

{#snippet digit(n: string)}
  <div class="digit" style="--n:{n}">
    <span>0</span>
    <span>1</span>
    <span>2</span>
    <span>3</span>
    <span>4</span>
    <span>5</span>
    <span>6</span>
    <span>7</span>
    <span>8</span>
    <span>9</span>
  </div>
{/snippet}

<div
  class="scrolled-number"
  style="--fsz:{fsz}"
  use:intersect={"0%"}
  onenter={set}
  onexit={reset}
>
  {#each tgt.split("") as d}
    <div class="frame">
      {#if d == "."}
        <span>.</span>
      {:else}
        {@render digit(d)}
      {/if}
    </div>
  {/each}
</div>

<style lang="scss">
  .frame {
    height: 1em;
    overflow: hidden;
    .digit {
      display: flex;
      flex-direction: column;
      transform: translateY(calc(var(--n) * -1em));
      transition: transform 1s ease-in-out;
    }
    span {
      max-height: 1em;
      display: block;
      line-height: 1em;
    }
  }
  .scrolled-number {
    display: inline-flex;
    font-size: var(--fsz);
  }
</style>

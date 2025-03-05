<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    value = $bindable(),
    tooltip,
    snapStrength = 0.02,
    snapPoints = [0, 0.25, 0.5, 0.75, 1],
  }: {
    value: number[];
    tooltip?: Snippet<[number]>;
    snapStrength?: number;
    snapPoints?: number[];
  } = $props();

  let selected = $state(-1);
  let el: HTMLElement = $state(null)!;
  const dragStart = (i: number) => () => {
    selected = i;
  };
  const dragEnd = () => {
    selected = -1;
  };
  const drag = (e: MouseEvent | TouchEvent) => {
    if (selected == -1) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const x =
      (e instanceof TouchEvent ? e.touches[0].clientX : e.clientX) - rect.left;
    let l = x / rect.width;
    for (let i = 0; i < snapPoints.length; i++) {
      const p = snapPoints[i];
      if (Math.abs(p - l) < snapStrength) {
        l = p;
        break;
      }
    }
    let next = value[selected + 1] ?? 1;
    let prev = value[selected - 1] ?? 0;
    l = Math.max(prev, Math.min(next, l));
    value[selected] = l;
  };
</script>

<svelte:window
  onmousemove={drag}
  onmouseup={dragEnd}
  ontouchend={dragEnd}
  ontouchmove={drag}
/>

<div class="range" bind:this={el}>
  {#each value as v, i}
    <div class="spacer" style="--s:{value[i - 1] ?? 0}; --e:{v}"></div>
    <button
      class="handle"
      aria-labelledby="handle"
      style="--l:{v}"
      onmousedown={dragStart(i)}
      ontouchstart={dragStart(i)}
    >
      {#if tooltip}
        <div class="tooltip">
          {@render tooltip(v)}
        </div>
      {/if}
    </button>
  {/each}
  <div class="spacer" style="--s:{value[value.length - 1] ?? 0}; --e:{1}"></div>
</div>

<style lang="scss">
  .range {
    position: relative;
    display: flex;
    align-items: center;
    height: 1rem;
    width: 100%;
    border-radius: 1rem;
    background-color: var(--neutral-2);
    max-width: 400px;
    &:hover {
      background-color: var(--neutral-3);
    }
    .spacer {
      position: absolute;
      height: 100%;
      left: calc(100% * var(--s));
      width: calc(100% * (var(--e) - var(--s)));
      pointer-events: none;
      &:first-of-type {
        border-radius: 1rem 0 0 1rem;
      }
      &:last-of-type {
        border-radius: 0 1rem 1rem 0;
      }
    }
    .handle {
      position: absolute;
      z-index: 1;
      --w: 1rem;
      height: var(--w);
      width: var(--w);
      border-radius: 50%;
      background-color: var(--neutral-3);
      border: 2px solid var(--neutral-12);
      left: calc(100% * var(--l));
      transform: translate(-50%);
      touch-action: none;
      cursor: pointer;
      .tooltip {
        display: none;
        position: absolute;
        top: -1rem;
        left: 50%;
        transform: translate(calc(var(--l) * -100%), -100%);
        background-color: var(--neutral-2);
        min-width: 3.5rem;
        width: max-content;
        padding: 0.25rem;
        border-radius: 3px;
        border: 1px solid var(--neutral-6);
        color: var(--neutral-12);
        &::after {
          content: "";
          position: absolute;
          bottom: -3px;
          left: calc(10px + var(--l) * (100% - 20px));
          transform: translate(-50%, 50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid var(--neutral-6);
          z-index: -1;
        }
      }

      &:active {
        background-color: var(--main-10);
        .tooltip {
          display: block;
        }
      }
    }
  }
</style>

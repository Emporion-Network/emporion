<script lang="ts">
  import type { Snippet } from "svelte";

  type T = $$Generic;
  let {
    value = $bindable(),
    options = $bindable(),
    optionRenderer,
  }: {
    value: T;
    options: T[];
    optionRenderer: Snippet<[T, boolean]>;
  } = $props();
  const select = (v: T) => () => {
    value = v;
  };
</script>

<div class="button-group">
  {#each options as option}
    {@const selected = value == option}
    <button onclick={select(option)} class:selected>
      {@render optionRenderer(option, selected)}
    </button>
  {/each}
</div>

<style lang="scss">
  .button-group {
    display: inline-flex;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid var(--neutral-7);
    border-radius: 4px;
    max-width: fit-content;
    background-color: var(--neutral-3);
    &:hover {
      border: 1px solid var(--neutral-8);
    }
  }

  button {
    cursor: pointer;
    border: 1px solid transparent;
    height: var(--height-1);
    color: var(--neutral-11);
    background-color: transparent;
    width: 100px;
    border-radius: 3px;
    position: relative;
    outline: none;
    &:focus-visible {
      border: 1px solid var(--main-10);
    }
    &.selected {
      background-color: var(--neutral-4);
      color: var(--neutral-12);
      font-weight: 600;
    }
  }
</style>

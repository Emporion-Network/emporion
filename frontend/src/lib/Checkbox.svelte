<script lang="ts">
  let {
    value = $bindable(),
    tabindex = 0,
    readonly,
  }: {
    value: boolean;
    tabindex?: number;
    readonly?: boolean;
  } = $props();

  const toggle = (e: Event) => {
    if (readonly) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    value = !value;
  };
</script>

<button
  class:selected={value}
  class:readonly
  onclick={toggle}
  aria-label={value ? "on" : "off"}
  {tabindex}
>
  {#if value}
    <i class="ri-check-line"></i>
  {/if}
</button>

<style lang="scss">
  button {
    width: 1rem;
    height: 1rem;
    aspect-ratio: 1/1;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--neutral-7);
    background-color: transparent;
    cursor: pointer;
    outline: none;
    font-weight: 900;
    &.readonly {
      cursor: default;
      &.selected,
      &:hover {
        background-color: transparent;
        border: 1px solid var(--neutral-7);
      }
    }
    &:hover,
    &:focus-visible {
      background-color: var(--main-4);
      border: 1px solid var(--main-7);
    }
    &.selected {
      color: var(--main-12);
      border: 1px solid var(--main-10);
    }
  }
</style>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { trapFocus } from "./actions.svelte";
  let {
    children,
    open = $bindable(),
    onclose = () => {},
  }: {
    children?: Snippet<[]>;
    open: boolean;
    onclose?: () => void;
  } = $props();

  const close = () => {
    open = false;
    onclose();
  };

  const closeOnEscape = (e: KeyboardEvent) => {
    if (["Esc", "Escape"].includes(e.key)) close();
  };
</script>

<svelte:window onkeydown={closeOnEscape} />

{#if open}
  <div class="modal" onclick={close} role="presentation" use:trapFocus>
    <div
      class="content"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      {@render children?.()}
    </div>
  </div>
{/if}

<style lang="scss">
  @use "../mixins" as m;

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    display: flex;
    background-color: var(--neutral-a1);
    backdrop-filter: blur(1.4px);
    z-index: 99;
    @keyframes slideup {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0%);
        opacity: 1;
      }
    }
    .content {
      animation: slideup 200ms ease-out forwards;
      @include m.media("<=phone") {
        width: 100vw;
        height: 80vh;
        position: absolute;
        bottom: 0;
      }
    }
  }
</style>

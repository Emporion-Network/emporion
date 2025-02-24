<script lang="ts">
  import { getAllContexts, mount, unmount, type Snippet } from "svelte";

  let {
    children,
    content,
    openTimout = 500,
    closeTimeout = 0,
  }: {
    children: Snippet;
    content: Snippet;
    openTimout?: number;
    closeTimeout?: number;
  } = $props();

  let visible = $state(false);
  let pos = $state("");
  let beforeOpen: ReturnType<typeof setTimeout>;
  let beforeClose: ReturnType<typeof setTimeout>;

  let el: HTMLElement;
  let wprEl: HTMLElement;
  const open = () => {
    visible = true;
    updatePos();
  };
  const updatePos = () => {
    if (!visible || !el || !wprEl) return;
    const elRect = el.getBoundingClientRect();
    const parentRect = wprEl.children.item(0)!.getBoundingClientRect();
    let x = parentRect.left + parentRect.width;
    let y = parentRect.top + parentRect.height;
    if (x + elRect.width > window.innerWidth) {
      x = parentRect.left - elRect.width;
    }
    if (y + elRect.height > window.innerHeight) {
      y = parentRect.top - elRect.height;
    }
    pos = `--l:${x}px;--t:${y}px;`;
  };
  const show = () => {
    beforeOpen = setTimeout(open, openTimout);
    clearTimeout(beforeClose);
  };
  const hide = () => {
    beforeClose = setTimeout(() => {
      visible = false;
      pos = "";
    }, closeTimeout);
    clearTimeout(beforeOpen);
  };
  const context = getAllContexts();
  let instance: ReturnType<typeof mount>;

  $effect(() => {
    instance = mount(Content, {
      target: document.body,
      props: {},
      context,
    });
    return () => {
      unmount(instance);
    };
  });
</script>

<svelte:document onscroll={updatePos} />

<div
  class="tooltip"
  onmouseenter={show}
  onmouseleave={hide}
  onfocus={show}
  role="tooltip"
  onblur={hide}
  bind:this={wprEl}
>
  {@render children()}
</div>

{#snippet Content()}
  <div class="content" style={pos} class:visible bind:this={el}>
    {@render content()}
  </div>
{/snippet}

<style lang="scss">
  .content {
    z-index: 9;
    position: fixed;
    opacity: 0;
    pointer-events: none;
    max-width: 300px;
    width: max-content;
    background-color: var(--neutral-3);
    padding: 0.5rem;
    border: 1px solid var(--neutral-6);
    border-radius: 3px;
    &.visible {
      opacity: 1;
      // pointer-events: all;
      left: var(--l);
      top: var(--t);
    }
    // &.bottom-left {
    //     top: 100%;
    //     left: 0%;
    // }
    // &.bottom-right {
    //     top: 100%;
    //     right: 0%;
    // }
    // &.top-left {
    //     bottom: 100%;
    //     left: 0%;
    // }
    // &.top-right {
    //     bottom: 100%;
    //     right: 0%;
    // }
    // &.bottom-center {
    //     top: 100%;
    //     left: 50%;
    //     transform: translateX(-50%);
    // }
    // &.top-center {
    //     bottom: 100%;
    //     left: 50%;
    //     transform: translateX(-50%);
    // }
  }
  .tooltip {
    z-index: 1;
    display: contents;
  }
</style>

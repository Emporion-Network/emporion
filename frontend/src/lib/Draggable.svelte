<script lang="ts">
    import { getTranslator } from "@/stores/translate.svelte";
  import type { Snippet } from "svelte";

  let {
    onswap,
    content,
    menu,
  }: {
    onswap: (dir: number) => void;
    content: Snippet;
    menu: Snippet;
  } = $props();

  let drag = $state(false);
  let y = $state(0);
  let dy = $state(0);
  let el: HTMLElement;

  const dragStart = (e: MouseEvent | TouchEvent) => {
    drag = true;
    y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
  };

  const dragEnd = (_e: MouseEvent | TouchEvent) => {
    drag = false;
    dy = 0;
    y = 0;
  };

  const dragMove = (e: MouseEvent | TouchEvent) => {
    if (drag) {
      dy = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      dy -= y;
      let d = dy >= 0 ? el.nextElementSibling : el.previousElementSibling;
      if (!d) return;
      let h = d.getBoundingClientRect().height * 0.5;
      if (Math.abs(dy) > h) {
        onswap(dy > 0 ? 1 : -1);
        y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
        y += h * (dy > 0 ? 1 : -1);
        dy = 0;
      }
    }
  };

  const t = getTranslator();

  export { el as element };
</script>

<svelte:body
  onmouseup={dragEnd}
  ontouchend={dragEnd}
  onmousemove={dragMove}
  ontouchmove={dragMove}
/>
<div class="draggable" class:dragging={drag} style="--y:{dy}" bind:this={el}>
  <div class="wrpr">
    <div class="handler">
      <button
        aria-label={t.t("quaint_teal_cheetah_fold")}
        onmousedown={dragStart}
        ontouchstart={dragStart}
      >
        <i class="ri-draggable"></i>
      </button>
    </div>
    <div class="content">
      {@render content()}
    </div>
    <div class="menu">
      {@render menu()}
    </div>
  </div>
</div>

<style lang="scss">
  .draggable {
    position: relative;
    margin-bottom: 1rem;
    .wrpr {
      display: flex;
      flex: 1;
      transform: translateY(calc(var(--y) * 1px));
      background-color: var(--parent-bg, var(--neutral-1));
      justify-content: center;
      align-items: center;
      border: 1px solid var(--neutral-6);
      border-radius: 3px;
    }
    &.dragging {
      z-index: 1;
      .wrpr {
        border: 1px solid var(--main-10);
        .handler button {
          cursor: grabbing;
        }
      }
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--main-a1);
        border: 1px solid var(--main-6);
        pointer-events: none;
        z-index: -1;
        margin-bottom: 1rem;
        border-radius: 3px;
      }
    }
    .handler {
      z-index: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      align-self: stretch;
      button {
        cursor: grab;
        background-color: transparent;
        border: none;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        outline: none;
        i {
          color: var(--neutral-8);
        }
      }
    }
    .menu {
      z-index: 1;
      display: flex;
      justify-content: center;
      align-self: stretch;
      align-items: center;
    }
    .content {
      z-index: 1;
      border-left: 1px solid var(--neutral-6);
      border-right: 1px solid var(--neutral-6);
      flex: 1;
      padding: 1rem;
    }
  }
</style>

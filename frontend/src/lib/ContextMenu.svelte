<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    opener,
    options,
  }: {
    opener: Snippet<
      [
        {
          get: () => HTMLElement;
          set: (e: HTMLElement) => void;
          onfocus: () => void;
        },
      ]
    >;
    options: Snippet<[() => true]>;
  } = $props();
  let pos = $state({
    t: 0,
    l: 0,
    rw: 0,
    rh: 0,
    cw: 0,
    ch: 0,
  });
  const onf = () => {
    let r = ref.getBoundingClientRect();
    let c = contentE.getBoundingClientRect();
    let t = r.top + r.height;
    let l = r.left;
    if (r.left + c.width > window.innerWidth) {
      l -= c.width - r.width;
    }
    if (t + c.height > window.innerHeight) {
      t = r.top - c.height;
    }
    pos = {
      t,
      l,
      rw: r.width,
      rh: r.height,
      cw: c.width,
      ch: c.height,
    };
  };

  let ref: HTMLElement = $state(null!);
  let contentE: HTMLElement = $state(null!);

  const get = () => {
    return ref;
  };
  const set = (v: HTMLElement) => {
    ref = v;
  };

  const close = () => {
    // @ts-expect-error doesnt know its an element
    document.activeElement?.blur();
    return true as const;
  };
</script>

<svelte:window onscroll={onf} onresize={onf} />

<div class="context-menu">
  {@render opener({ get, set, onfocus: onf })}
  <div
    class="content"
    style="--l:{pos.l}px; --t:{pos.t}px;--rw:{pos.rw}px; --rh:{pos.rh}px;--cw:{pos.cw}px; --ch:{pos.ch}px;"
    bind:this={contentE}
  >
    {@render options(close)}
  </div>
</div>

<style lang="scss">
  .context-menu {
    display: contents;
    &:focus-within {
      .content {
        display: flex;
        flex-direction: column;
      }
    }
    .content {
      display: none;
      position: fixed;
      min-width: var(--rw);
      left: var(--l);
      top: var(--t);
      background-color: var(--parent-bg);
      border: 1px solid var(--neutral-6);
      border-radius: 3px;
      z-index: 1;
      margin: var(--margin, 0);
    }
  }
</style>

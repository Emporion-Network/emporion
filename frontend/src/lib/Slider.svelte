<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { intersect } from "./actions.svelte";
  let el: HTMLElement;
  let {
    children,
    speed = 1,
    dir = 1,
  }: {
    children: Snippet;
    speed?: number;
    dir?: 1 | -1;
  } = $props();

  let animated = false;

  const load = () => {
    animated = true;
  };

  const unload = () => {
    animated = false;
  };

  function animateScroll() {
    let position = 0;
    const slideWidth = el.scrollWidth / 2;

    function step() {
      if (!el) return;
      if (animated) {
        position -= dir * speed;
        el.style.transform = `translateX(${position}px)`;

        if (dir == 1 && Math.abs(position) >= slideWidth + 18) {
          position = 0;
          el.style.transform = `translateX(${position}px)`;
        } else if (dir == -1 && position >= 0) {
          position = -slideWidth;
          el.style.transform = `translateX(${position}px)`;
        }
      }
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  onMount(() => {
    // animate();
    animateScroll();
  });
</script>

<div class="wpr" use:intersect={"0%"} onenter={load} onexit={unload}>
  <div class="slider" bind:this={el}>
    {#each { length: 2 } as _}
      {@render children()}
    {/each}
  </div>
</div>

<style lang="scss">
  .wpr {
    max-width: 100vw;
    overflow: hidden;
    position: relative;
    &::after {
      content: "";
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background: linear-gradient(to right, #000 0%, transparent, #000 100%);
      pointer-events: none;
    }
  }
  .slider {
    max-width: 1200px;
    // overflow: hidden;
    display: flex;
    gap: 2rem;
    min-width: 0;
    position: relative;
    flex: 0 0 auto;
    will-change: transform;
    transform: translateZ(0); /* Force GPU layer */
    backface-visibility: hidden; /* Prevent flicker */
    perspective: 1000px; /* Extra stabilization */
  }
</style>

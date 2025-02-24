<script lang="ts">
  import { onMount } from "svelte";

  let el: SVGElement;
  let inview = false;
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            inview = true;
          } else {
            inview = false;
          }
        });
      },
      {
        root: null,
        rootMargin: "0% 0% -50% 0%",
      },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  });
</script>

<svg viewBox="0 0 27 112" fill="none" bind:this={el} class:inview>
  <path
    d="M13.5 25.3 1.2 13 13.5.7 25.8 13 13.5 25.3V112"
    stroke-miterlimit="10"
    stroke-dasharray="560"
  ></path>
</svg>

<style lang="scss">
  svg {
    stroke-dashoffset: 560;
    width: 1.5rem;
    transition: stroke-dashoffset 1200ms linear;
    margin-bottom: -100px;

    path {
      stroke: var(--white-a4);
      fill: transparent;
      transition: fill 1200ms ease-in;
    }
    &.inview {
      stroke-dashoffset: 0;
      path {
        fill: var(--white-a12);
      }
    }
  }
</style>

<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  let animate = $state(false);
  let noTransition = $state(false);
  let { children }: { children: Snippet } = $props();
  let el: HTMLElement;
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate = true;
          } else {
            animate = false;
          }
        });
      },
      {
        root: null,
        rootMargin: "0% 0% -30% 0%",
      },
    );
    observer.observe(el);
    const cleanAnimation = () => {
      noTransition = true;
      animate = false;
      setTimeout(() => {
        noTransition = false;
      });
    };
    el.addEventListener("animationend", cleanAnimation);
    return () => {
      observer.disconnect();
      el.removeEventListener("animationend", cleanAnimation);
    };
  });
</script>

<div class="cards" class:animate class:noTransition bind:this={el}>
  {@render children()}
</div>

<style lang="scss">
  @property --p {
    syntax: "<percentage>"; /* <- defined as type number for the transition to work */
    initial-value: 0%;
    inherits: false;
  }
  .cards {
    display: grid;
    grid-template-rows: 1fr;
    grid-auto-flow: column;
    align-content: center;
    justify-content: center;
    max-width: 1200px;
    width: 100%;
    cursor: default;

    &.animate {
      :global(.card) {
        &::after,
        &::before {
          --p: 0%;
          transform: scale(1);
          transition: none;
          border-image: linear-gradient(
              to bottom,
              transparent var(--p),
              var(--red-a6) var(--p),
              var(--red-a6) calc(var(--p) + 50%),
              transparent calc(var(--p) + 50%),
              transparent var(--p)
            )
            5;
          border-top: none;
          border-bottom: none;

          animation: show 1200ms ease-in forwards;
          @keyframes show {
            from {
              --p: -100%;
            }
            to {
              background-color: transparent;
              --p: 100%;
            }
          }
        }
      }
    }

    &.noTransition {
      :global(.card) {
        &::after,
        &::before {
          transition: none;
        }
      }
    }
  }
</style>

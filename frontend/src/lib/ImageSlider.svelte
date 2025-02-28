<script lang="ts">
    import { getTranslator } from "@/stores/translate.svelte";

  let {
    images,
    alt,
  }: {
    images: string[];
    alt: string;
  } = $props();

  const t = getTranslator();

  let element: HTMLElement = $state()!;
  let i = $state(0);

  const slide = (n: number) => () => {
    i += n;
    element.scrollTo({
      left: element.querySelectorAll("img")[i].offsetLeft,
      behavior: "smooth",
    });
  };
</script>

<div class="gellery" bind:this={element}>
  {#each images as img}
    <img src={img} {alt} />
  {/each}
  {#if images.length}
    <div class="buttons">
      <button aria-label="{t.t("neat_sound_meerkat_drum")}" class:hide={i == 0} onclick={slide(-1)}>
        <i class="ri-arrow-left-wide-line"></i>
      </button>
      <button
        aria-label="{t.t("close_antsy_jannes_praise")}"
        class:hide={i == images.length - 1}
        onclick={slide(+1)}
      >
        <i class="ri-arrow-right-wide-line"></i>
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .gellery {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: sticky;
    top: 2rem;
    border-radius: 4px;
    .buttons {
      right: 0%;
      position: sticky;
      min-width: 100%;
      margin-left: -100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      button {
        background-color: var(--neutral-4);
        border: none;
        outline: none;
        color: var(--neutral-12);
        aspect-ratio: 1;
        border-radius: 3px;
        cursor: pointer;
        &.hide {
          visibility: hidden;
        }
      }
    }
    img {
      min-width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      background-color: var(--neutral-3);
    }
  }
</style>

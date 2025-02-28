<script lang="ts">
  import ToolTip from "@/lib/ToolTip.svelte";
  import { getFile, getKeys } from "@/lib/utils";
  import {
    getTranslator,
    Languages,
    TranslatedLanguages,
    type SupportedLanguage,
  } from "@/stores/translate.svelte";
  import { getTutoRegistry } from "./tutoStore.svelte";
  let t = getTranslator();

  let {
    images = $bindable(),
    selectedLang,
  }: {
    selectedLang: SupportedLanguage;
    images: Record<SupportedLanguage, string[]>;
  } = $props();

  let registry = getTutoRegistry();

  const replaceImage = (id: number) => async () => {
    if (images[selectedLang][id] === undefined) {
      let x = await getFile();
      if (!x) return;
      images[selectedLang].push(x);
      getKeys(images).forEach((k) => {
        if (k == selectedLang) return;
        images[k].push("");
      });
      return;
    }
    let x = await getFile();
    if (!x) return;
    images[selectedLang][id] = x;
  };

  const applyToAll = (id: number) => (e: Event) => {
    e.stopPropagation();
    let t = images[selectedLang][id];
    if (!t) {
      let lang = getKeys(images).find((lang) => images[lang][id])!;
      t = images[lang][id];
    }
    getKeys(images).forEach((lang) => {
      if (!images[lang][id]) {
        images[lang][id] = t;
      }
    });
  };

  const remove = (id: number) => (e: Event) => {
    e.stopPropagation();
    getKeys(images).forEach((lang) => {
      images[lang] = images[lang].filter((_, i) => i != id);
    });
  };

  let missingImgages = $derived.by(() => {
    let missing: Record<number, SupportedLanguage[]> = {};
    getKeys(Languages).forEach((lang) => {
      images[lang].forEach((_, i) => {
        missing[i] = [];
      });
    });
    getKeys(missing).forEach((imgIdx) => {
      getKeys(Languages).forEach((lang) => {
        if (!images[lang][imgIdx]) {
          missing[imgIdx].push(lang);
        }
      });
    });
    return missing;
  });
  let element: HTMLElement = $state()!;

  export const actions = {
    addImage(img: string) {
      images[selectedLang].push(img);
    },
  };
  export { element };
</script>

{#snippet Image(i: number)}
  <div
    class="{i === 0 ? 'main-img' : ''} img"
    aria-label={images[selectedLang]?.[i]
      ? t.t("plain_calm_goose_ascend")
      : t.t("antsy_helpful_hamster_enjoy")}
    onkeydown={(e) => e.key == "Enter" && replaceImage(i)()}
    tabindex="0"
    role="button"
    onclick={replaceImage(i)}
  >
    {#if images[selectedLang]?.[i]}
      {@const img = images[selectedLang]?.[i]}
      <img src={img} alt="" />
      <button
        class="delete"
        aria-label={t.t("each_watery_lamb_zap")}
        onclick={remove(i)}
      >
        <i class="ri-indeterminate-circle-line"></i>
      </button>
    {:else}
      <i class="ri-image-add-line"></i>
    {/if}
    {#if missingImgages[i]?.length}
      <ToolTip>
        <button
          bind:this={registry[`translate_image_${i}`]}
          class="apply-img"
          onclick={applyToAll(i)}
          aria-label={t.t("jumpy_wise_skate_greet")}
        >
          <i class="ri-translate"></i>
        </button>
        {#snippet content()}
          <p>{t.t("jumpy_wise_skate_greet")}</p>
          <ul>
            {#each missingImgages[i] as lang}
              <li>{t.t(TranslatedLanguages[lang])}</li>
            {/each}
          </ul>
        {/snippet}
      </ToolTip>
    {:else if missingImgages[i]?.length === 0}
      <ToolTip>
        <button class="apply-img ok" aria-label={t.t("sour_main_cobra_laugh")}
          ><i class="ri-translate"></i></button
        >
        {#snippet content()}
          <p>{t.t("ok_fluffy_quail_race")}</p>
        {/snippet}
      </ToolTip>
    {/if}
  </div>
{/snippet}

<div class="gallery" bind:this={element}>
  {@render Image(0)}
  <div class="wpr">
    <div class="carousel hide-scrollbar">
      {#each images[selectedLang] as _, i}
        {#if i != 0}
          {@render Image(i)}
        {/if}
      {/each}
      {@render Image(images[selectedLang]?.length || 1)}
    </div>
  </div>
</div>

<style lang="scss">
  .gallery {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    .img {
      background-color: transparent;
      border: 1px solid var(--neutral-6);
      color: var(--neutral-11);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      & > i {
        font-size: 1.2rem;
      }
      &:hover {
        background-color: var(--neutral-a3);
        border: 1px solid var(--neutral-7);
        .delete {
          display: block;
        }
      }
      img {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
        left: 0;
        top: 0;
        z-index: -1;
        border-radius: 2px;
      }
      .delete {
        background-color: var(--red-3);
        border-radius: 3px;
        border: 1px solid var(--red-7);
        color: var(--red-11);
        cursor: pointer;
        outline: none;
        display: none;
      }
    }
    .main-img {
      width: 100%;
      aspect-ratio: 1/1;
    }
    .wpr {
      display: grid;
      width: 100%;
    }
    .carousel {
      display: flex;
      overflow-x: auto;
      gap: 1rem;

      .img {
        min-width: 100px;
        aspect-ratio: 1/1;
      }
    }
    .apply-img {
      max-width: max-content;
      border: none;
      outline: none;
      aspect-ratio: 1/1;
      border-radius: 3px;
      align-self: flex-start;
      border-style: solid;
      color: var(--orange-11);
      border: 1px solid var(--orange-6);
      background-color: var(--orange-3);
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      &.ok {
        color: var(--green-11);
        border: 1px solid var(--green-6);
        background-color: var(--green-3);
      }
    }
  }
</style>

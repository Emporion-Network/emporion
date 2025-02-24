<script lang="ts">
  import TranslatableInput from "@/lib/TranslatableInput.svelte";
  import { getFile } from "@/lib/utils";
  import {
    getTranslator,
    type SupportedLanguage,
  } from "@/stores/translate.svelte";
  import type { Attribute } from "./_meta";
  let {
    attribute = $bindable(),
    lang = $bindable(),
  }: {
    attribute: Attribute;
    lang: SupportedLanguage;
  } = $props();

  let t = getTranslator();

  const setImage = async () => {
    let f = await getFile();
    if (!f) return;
    attribute.value = f;
  };
</script>

<div class="input-attribute">
  <button
    class="image"
    aria-label={t.t("aware_salty_marlin_hack")}
    onclick={setImage}
  >
    {#if attribute.value}
      <img src={attribute.value} alt="" />
    {:else}
      <i class="ri-image-add-line"></i>
    {/if}
  </button>
  <TranslatableInput
    type="text"
    label={"Color name"}
    bind:selectedLang={lang}
    bind:value={attribute.label}
  />
</div>

<style lang="scss">
  .input-attribute {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    button {
      width: 40px;
      height: 40px;
      border-radius: 40px;
      outline: none;
      border: none;
      padding: 0;
      img {
        width: 100%;
        height: 100%;
        border-radius: 100%;
        object-fit: cover;
      }
    }
    :global(.translatable-input) {
      flex: 1;
    }
  }
</style>

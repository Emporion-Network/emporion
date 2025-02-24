<script lang="ts">
  import ColorInput from "@/lib/ColorInput.svelte";
  import TranslatableInput from "@/lib/TranslatableInput.svelte";
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

  let element: HTMLElement = $state()!;
  let t = getTranslator();

  export const actions = {
    setLabel(v: string) {
      attribute.label[lang] = v;
    },
    setValue(v: string) {
      attribute.value = v;
    },
    open() {
      (element.querySelector("button.selected")! as HTMLButtonElement).focus();
    },
  };
  export { element };
</script>

<div class="input-attribute" bind:this={element}>
  <ColorInput bind:value={attribute.value} />
  <TranslatableInput
    type="text"
    label={t.t("fancy_awful_spider_forgive")}
    selectedLang={lang}
    bind:value={attribute.label}
  />
</div>

<style lang="scss">
  .input-attribute {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    :global(.translatable-input) {
      flex: 1;
    }
  }
</style>

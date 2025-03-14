<script lang="ts">
  import { untrack } from "svelte";
  import type { SupportedLanguage } from "../../../../stores/translate.svelte";
  import type { Attribute } from "./_meta";
  let {
    attributes,
    selectedLang,
    pref = $bindable(),
    value,
  }: {
    attributes: Attribute[];
    selectedLang: SupportedLanguage;
    value: number;
    pref: number[];
    prefs: number[][];
    onupdate: (v: number[]) => void;
  } = $props();

  $effect(() => {
    let _ = value;
    untrack(() => {
      pref = attributes.map((_, i) => i);
    });
  });
</script>

<h2>{attributes[0]?.value?.[selectedLang]}</h2>

<style lang="scss">
  h2 {
    text-align: center;
    line-height: 1.1em;
  }
</style>

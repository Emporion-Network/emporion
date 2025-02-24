<script lang="ts">
    import { untrack } from 'svelte';
    import type { SupportedLanguage } from '@/stores/translate.svelte';
    import type { Attribute } from './_meta';
    let {
      attributes,
      selectedLang,
      value,
      pref = $bindable(),
    }: {
      attributes: Attribute[]
      selectedLang: SupportedLanguage
      value: number
      pref: number[]
      prefs: number[][]
      onupdate: (v: number[]) => void
    } = $props();

    ///
    $effect(() => {
      let _ = value;
      untrack(() => {
        pref = attributes.map((_, i) => i);
      });
    });

</script>

<p>{attributes[0]?.value?.[selectedLang]}</p>

<style lang="scss">
    p{
        text-align: center;
        white-space: pre-wrap;
        color: var(--neutral-11);
        line-height: 1.1em;
    }
</style>

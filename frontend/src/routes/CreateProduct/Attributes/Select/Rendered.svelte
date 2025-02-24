<script lang="ts">
    import { untrack } from 'svelte';
    import MultiSelect from '@/lib/MultiSelect.svelte';
    import type { SupportedLanguage } from '@/stores/translate.svelte';
    import type { Attribute } from './_meta';
    import { intersect } from '@/lib/utils';
    let {
      attributes,
      selectedLang,
      value,
      pref = $bindable(),
      prefs,
      onupdate,
    }: {
      attributes: Attribute[]
      selectedLang: SupportedLanguage
      value: number
      pref: number[]
      prefs: number[][]
      onupdate: (v: number[]) => void
    } = $props();

    let options = $derived.by(() => {
      const map: Record<string, number[]> = {};
      attributes.forEach((a, i) => {
        map[a.value[selectedLang]] = map[a.value[selectedLang]] ?? [];
        map[a.value[selectedLang]].push(i);
      });
      return Object.values(map);
    });

    $effect(() => {
      let _ = value;
      untrack(() => {
        pref = options[get()];
      });
    });

    const get = () => {
      return options.findIndex(v => v.includes(value));
    };
    const set = (i: number) => {
      pref = options[i];
      onupdate(options[i]);
    };

    const isAvailable = (i: number) => {
      let fut = prefs.filter(e => e !== pref);
      return intersect(options[i], ...fut).length > 0;
    };
</script>

<div class="wpr">
    <MultiSelect options={[...options.keys()]} bind:value={get, set} multiple={false}>
        {#snippet valueRenderer(i)}
            {@const idx = options[i][0]}
            {attributes[idx].value[selectedLang]}
        {/snippet}
        {#snippet optionRenderer(i)}
            {@const idx = options[i][0]}
            <span class:unavailable={!isAvailable(i)}>{attributes[idx].value[selectedLang]}</span>
        {/snippet}
    </MultiSelect>
</div>

<style lang="scss">
    .wpr{
        :global(.multi-select){
            margin: 1rem 0;
        }
        .unavailable{
            opacity: 0.4;
        }
    }

</style>

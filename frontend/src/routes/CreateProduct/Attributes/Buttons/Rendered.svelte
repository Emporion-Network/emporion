<script lang="ts">
    import { untrack } from 'svelte';
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

<div class="buttons">
    {#each options as _, i}
        {@const idx = options[i][0]}
        <button
            class:unavailable={!isAvailable(i)}
            onclick={() => set(i)}
            class:selected={get() == i}
        >
            {attributes[idx].value[selectedLang]}
        </button>
    {/each}
</div>

<style lang="scss">
    .buttons {
        display: flex;
        gap:1rem;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: center;
        padding:1rem 0;
        button{
            background-color: transparent;
            border: 1px solid var(--neutral-6);
            border-radius: 3px;
            padding: 0.5rem;
            color: var(--neutral-12);
            outline: none;
            cursor: pointer;
            &:hover{
                border: 1px solid var(--neutral-8);
            }
        }
        .unavailable {
            border: 1px solid var(--neutral-5);
            color: var(--neutral-8);
        }
        .selected {
            border: 1px solid var(--main-10);
            font-weight: 900;
            &:hover{
                border: 1px solid var(--main-10);
            }
        }
    }
</style>

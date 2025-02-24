<script lang="ts">
  import { untrack } from 'svelte';
  import ToolTip from '@/lib/ToolTip.svelte';
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
    pref: number[]
    prefs: number[][]
    value: number
    onupdate: (v: number[]) => void
  } = $props();

  let options = $derived.by(() => {
    const map: Record<string, number[]> = {};
    attributes.forEach((attr, id) => {
      map[attr.value] = map[attr.value] ?? [];
      map[attr.value].push(id);
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
  {#each options as _, i}
    {@const idx = options[i][0]}
    <ToolTip>
      <button
        aria-label={attributes[idx].label[selectedLang]}
        class:selected={get() == i}
        onclick={() => set(i)}
        class:unavialable={!isAvailable(i)}
      >
        {#if attributes[idx].value}
          <img
            src={attributes[idx].value}
            alt={attributes[idx].label[selectedLang]}
          />
        {:else}
          <i class="ri-image-2-line"></i>
        {/if}
      </button>
      {#snippet content()}
        {attributes[idx].label[selectedLang]}
      {/snippet}
    </ToolTip>
  {/each}
</div>

<style lang="scss">
  .wpr {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
    justify-content: center;
    flex-wrap: wrap;
    button {
      outline: none;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 40px;
      color: var(--neutral-9);
      background-color: transparent;
      padding: 0;
      cursor: pointer;
      font-size: 1.3rem;
      border: 1px solid var(--neutral-6);
      img {
        width: 100%;
        height: 100%;
        border-radius: 100%;
        object-fit: cover;
      }
      &.unavialable {
        opacity: 0.4;
      }
      &.selected {
        outline: 2px solid var(--main-10);
        outline-offset: 2px;
      }
    }
  }
</style>

<script lang="ts">
    import type { SvelteComponent } from 'svelte';
    import MultiSelect from '@/lib/MultiSelect.svelte';
    import { getTranslator } from '@/stores/translate.svelte';
    import { attributeTypeValues, metas, type Attribute } from './_metas';
    let t = getTranslator();
    let {
      attributeType = $bindable(),
      attributes = $bindable(),
      onpush,
    }: {
      attributeType: Attribute['display_type']
      attributes: Attribute[]
      onpush?: () => void
    } = $props();
    let el: HTMLElement = $state()!;
    let ms: SvelteComponent;

    const addAttribute = () => {
      attributes.push(metas[attributeType].defaultValue);
      onpush?.();
    };

    export const actions = {
      select(t: typeof attributeType) {
        ms.actions.setValue(t);
      },
      add() {
        addAttribute();
      },
      open() {
        ms.actions.open();
      },
      clear() {
        ms.actions.setValue('buttons');
        attributes = [];
      },
    };

    export {
      el as element,
    };

</script>
<div class="attribute-selector" bind:this={el}>
    <MultiSelect
        options={attributeTypeValues}
        label={t.t('level_arable_robin_talk')}
        placeholder={t.t('level_arable_robin_talk')}
        bind:value={attributeType}
        multiple={false}
        bind:this={ms}
    >
        {#snippet optionRenderer(v)}
            {t.t(metas[v].label as never)}
        {/snippet}
        {#snippet valueRenderer(v)}
            {t.t(metas[v].label as never)}
        {/snippet}
    </MultiSelect>
    <button class="secondary-button" onclick={addAttribute}>
        <i class="ri-add-line"></i>
        {t.t('key_muddy_martin_flop')}
    </button>
</div>

<style lang="scss">
    .attribute-selector {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        :global(.multi-select){
           flex: 1;
        }
    }
</style>

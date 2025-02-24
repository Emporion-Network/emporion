<script lang="ts">
    import { metas, type Attribute } from './_metas';
    import { type SupportedLanguage } from '@/stores/translate.svelte';
    import Buttons from './Buttons/InProduct.svelte';
    import Checkbox from './Checkbox/InProduct.svelte';
    import Select from './Select/InProduct.svelte';
    import Color from './Color/InProduct.svelte';
    import Title from './Title/InProduct.svelte';
    import Paragraph from './Paragraph/InProduct.svelte';
    import ImageButtons from './ImageButtons/InProduct.svelte';
    import { getTutoRegistry } from '../tutoStore.svelte';
    import type { Component } from 'svelte';

    let {
      attributes = $bindable(),
      selectedLang,
    }: {
      selectedLang: SupportedLanguage
      attributes: Attribute[]
    } = $props();
    const map = {
      [metas.buttons.type]: Buttons,
      [metas.checkbox.type]: Checkbox,
      [metas.select.type]: Select,
      [metas.color.type]: Color,
      [metas.title.type]: Title,
      [metas.paragraph.type]: Paragraph,
      [metas.image_buttons.type]: ImageButtons,
    };
    let registry = getTutoRegistry();
</script>

{#each attributes as attr, i (attr)}
    {@const Component = map[attr.display_type] as Component}
    <Component
        bind:attribute={attributes[i]}
        lang={selectedLang}
        bind:this={registry[`product_attribute_${i}`]}
    />
{/each}

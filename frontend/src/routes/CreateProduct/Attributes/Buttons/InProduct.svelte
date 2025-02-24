<script lang="ts">
    import TranslatableInput from '@/lib/TranslatableInput.svelte';
    import { type SupportedLanguage } from '@/stores/translate.svelte';
    import type { Attribute } from './_meta';
    let { attribute = $bindable(), lang = $bindable() }: {
      attribute: Attribute
      lang: SupportedLanguage
    } = $props();

    let element: HTMLElement = $state()!;

    export const actions = {
      setValue(v: string) {
        attribute.value[lang] = v;
      },
    };
    export {
      element,
    };
</script>

<div class="input-attribute" bind:this={element}>
    <TranslatableInput
        type="text"
        label={attribute.trait_type}
        bind:selectedLang={lang}
        bind:value={attribute.value}
    />
</div>

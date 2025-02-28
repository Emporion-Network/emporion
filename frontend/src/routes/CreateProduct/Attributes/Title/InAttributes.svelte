<script lang="ts">
    import Input from '../../../../lib/Input.svelte';
    import TranslatableInput from '../../../../lib/TranslatableInput.svelte';
    import { getTranslator, type SupportedLanguage } from '../../../../stores/translate.svelte';
    import { type Attribute } from './_meta';
    let { attribute = $bindable(), lang = $bindable() }: {
      attribute: Attribute
      lang: SupportedLanguage
    } = $props();

    let t = getTranslator();
    let element: HTMLElement = $state()!;

    export const actions = {
      setValue(v: string) {
        attribute.trait_type = v;
      },
    };
    export {
      element,
    };
</script>
<div class="attribute" bind:this={element}>
    <Input type="text" label={t.t('heavy_late_leopard_snap')} placeholder={t.t('heavy_late_leopard_snap')} bind:value={attribute.trait_type}/>
    <TranslatableInput type="text" label={t.t('crazy_bright_bobcat_soar')} selectedLang={lang} bind:value={attribute.value}/>
</div>

<style lang="scss">
    .attribute{
        display: flex;
        flex-direction: column;
        gap:1rem;
    }
</style>

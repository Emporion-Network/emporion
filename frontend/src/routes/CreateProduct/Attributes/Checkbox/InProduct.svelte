<script lang="ts">
    import Checkbox from '@/lib/Checkbox.svelte';
    import { type SupportedLanguage } from '@/stores/translate.svelte';
    import { type Attribute } from './_meta';
    let { attribute = $bindable(), lang = $bindable() }: {
      attribute: Attribute
      lang: SupportedLanguage
    } = $props();

</script>
<div class="input-attribute">
    <Checkbox bind:value={attribute.value}></Checkbox>
    <div>{attribute.trait_type}</div>
</div>

<style lang="scss">
    .input-attribute{
        display: flex;
        flex-direction: row;
        align-items: center;
    }
</style>

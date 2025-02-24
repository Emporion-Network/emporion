<script lang="ts">
    import Input from '@/lib/Input.svelte';
    import { getTranslator } from '@/stores/translate.svelte';
    import { type Attribute } from './_meta';
    let { attribute = $bindable() }: {
      attribute: Attribute
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
</div>

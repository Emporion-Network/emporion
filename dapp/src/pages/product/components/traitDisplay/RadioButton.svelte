<script lang="ts">
    import Radio from "../../../../lib/Radio.svelte";
    import Tooltip from "../../../../lib/Tooltip.svelte";
    export let values:Map<string, {ids:string[], isDisabeled:boolean}>;
    export let productId:string;
    export let selected = Array.from(values.values()).find(e => {
        return e.ids.includes(productId)
    })?.ids;

    $:selected = Array.from(values.values()).find(e => {
        return e.ids.includes(productId)
    })?.ids;
    export let label:string;

</script>
<h4>{label}</h4>
<Radio bind:selected="{selected}" let:select>
    {#each values.entries() as [label, {ids, isDisabeled}]}
        {#if isDisabeled}
        <Tooltip text="This option is not available in this configuration ">
            <button class="button-2"
            class:selected={ids.includes(productId)}
            class:disable={isDisabeled}
            on:click={select(ids)}>{label}</button>
        </Tooltip>
        {:else}
        <button class="button-2"
        class:selected={ids.includes(productId)}
        class:disable={isDisabeled}
        on:click={select(ids)}>{label}</button>
        {/if}
    {/each}
</Radio>



<style lang="scss">
    .button-2{
        min-height: 3rem;
        border-radius: 5px;
        &.selected{
            border: 2px solid var(--indigo-10);
        }
        &.disable{
            opacity: 0.1;
        }
    }
</style>
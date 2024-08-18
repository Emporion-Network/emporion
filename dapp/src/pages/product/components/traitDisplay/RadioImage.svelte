<script lang="ts">
    import Radio from "../../../../lib/Radio.svelte";
    import Tooltip from "../../../../lib/Tooltip.svelte";
    import type {Attribute} from "../AttributesMaker.svelte";
    type RadioImage = Exclude<Extract<Attribute, {display_type:"radio-image"}>['value'], undefined>;
    export let values:Map<RadioImage, {ids:string[], isDisabeled:boolean}>;
    export let productId:string;
    export let label:string;
    export let selected = Array.from(values.values()).find(e => {
        return e.ids.includes(productId)
    })?.ids;

    $:selected = Array.from(values.values()).find(e => {
        return e.ids.includes(productId)
    })?.ids;
    $:imageLabel = Array.from(values.entries()).find(([_, {ids}])=>{
        return ids.includes(productId)
    })?.[0].label||""

</script>
<h4>{label} {imageLabel}</h4>
<Radio bind:selected="{selected}" let:select>
    {#each values.entries() as [{label, src}, {ids, isDisabeled}]}
        {#if isDisabeled}
        <Tooltip text="This option is not available in this configuration ">
        <button class="radio-image"
            class:selected={ids.includes(productId)}
            class:disable={isDisabeled}
            on:click={select(ids)}>
            <img src="{src}" alt={label}>
            <span>{label}</span>
        </button>
        </Tooltip>
        {:else}
        <button class="radio-image"
            class:selected={ids.includes(productId)}
            class:disable={isDisabeled}
            on:click={select(ids)}>
            <img src="{src}" alt={label}>
            <span>{label}</span>
        </button>
        {/if}
    {/each}
</Radio>



<style lang="scss">
    .radio-image{
        min-height: 3rem;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap:0.5rem;
        background-color: transparent;
        color: var(--gray-12);
        border: none;
        cursor: pointer;

        img{
            width: 30px;
            height: 30px;
            border-radius: 30px;
        }
        &.selected{
            img{
                outline: 2px solid var(--indigo-10);
                outline-offset: 3px;
            }
        }
        &.disable{
            opacity: 0.1;
        }
    }
</style>
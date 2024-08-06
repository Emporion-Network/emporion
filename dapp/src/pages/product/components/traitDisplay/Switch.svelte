<script lang="ts">
    import type { Attribute } from "../AttributesMaker.svelte";

   type ColorAttribute = Exclude<Extract<Attribute, {display_type:"switch"}>['value'], undefined>;
    export let values:Map<ColorAttribute, {ids:string[], isDisabeled:boolean}>;
    export let productId:string;
    export let selected = Array.from(values.values()).find(e => {
        return e.ids.includes(productId)
    })?.ids;
    export let label:string;

    $:selected = Array.from(values.values()).find(e => {
        return e.ids.includes(productId)
    })?.ids;

    const select = (select:string[])=>()=>{
        selected = select;
    }

</script>

<div class="wrpr">
    {#each values.entries() as [label, {ids}]}
        {#if ids.includes(productId)}
            <button class="toggle" class:on={label} on:click={select(values.get(!label)?.ids||[])}></button>
        {/if}
    {/each}
    <h4>{label}</h4>
</div>


<style lang="scss">
    .wrpr{
        display: flex;
        // justify-content: center;
        align-items: center;
        gap:1rem;
    }
    .toggle{
        background-color: var(--gray-a6);
        height: 1.6rem;
        width: 3.2rem;
        border: none;
        border-radius: 2rem;
        position: relative;
        cursor: pointer;
        &::after{
            content: "";
            width: calc(1.6rem - 2px);
            height: calc(1.6rem - 2px);
            border-radius: 1.6rem;
            background-color: var(--gray-10);
            position: absolute;
            top: 1px;
            left: 1px;
            transition: all 100ms ease-in-out;
        }
        &.on{
            background-color: var(--gray-a8);
            &::after{
                background-color: var(--gray-12);
                left: 50%;
            }
        }
    }
</style>
<script lang="ts">
    import Radio from "../../../../lib/Radio.svelte";
    import Tooltip from "../../../../lib/Tooltip.svelte";
    import type { Attribute } from "../AttributesMaker.svelte";

    type Color = Exclude<Extract<Attribute, {display_type:"color"}>['value'], undefined>;

    export let values: Map<Color, { ids: string[]; isDisabeled: boolean }>;
    export let productId: string;
    export let selected = Array.from(values.values()).find((e) => {
        return e.ids.includes(productId);
    })?.ids;
    export let label:string;

    $: selected = Array.from(values.values()).find((e) => {
        return e.ids.includes(productId);
    })?.ids;
    $:colorLabel = Array.from(values.entries()).find(([_, {ids}])=>{
        return ids.includes(productId)
    })?.[0].label||""
</script>

<h4>{label} {colorLabel}</h4>
<Radio bind:selected let:select>
    {#each values.entries() as [color, { ids, isDisabeled }]}
        {#if isDisabeled}
            <Tooltip text="This color is not available in this configuration ">
                <button
                    class="color button-2"
                    class:selected={ids.indexOf(productId) !== -1}
                    style="--color:{color.color}"
                    class:disable={isDisabeled}
                    on:click={select(ids)}
                ></button>
            </Tooltip>
        {:else}
            <button
                class="color button-2"
                class:selected={ids.indexOf(productId) !== -1}
                style="--color:{color.color}"
                class:disable={isDisabeled}
                on:click={select(ids)}
            ></button>
        {/if}
    {/each}
</Radio>

<style lang="scss">
    .color.button-2 {
        min-width: 3rem;
        min-height: 3rem;
        background-color: var(--color);
        border-color: var(--gray-8);
        border-radius: 3px;
        border: 2px solid transparent;
        &.selected, &:hover.selected {
            border: 2px solid var(--indigo-10);
        }
        &:hover{
            border: 2px solid var(--gray-12);
            background-color: var(--color);
        }
        &.disable {
            opacity: 0.1;
        }
    }
</style>

<script lang="ts">
    import Radio from "../../../../lib/Radio.svelte";
    import Tooltip from "../../../../lib/Tooltip.svelte";
    export let values: Map<string, { ids: string[]; isDisabeled: boolean }>;
    export let productId: string;
    export let selected = Array.from(values.values()).find((e) => {
        return e.ids.includes(productId);
    })?.ids;
    export let label:string;

    $: selected = Array.from(values.values()).find((e) => {
        return e.ids.includes(productId);
    })?.ids;
</script>

<h4>{label}</h4>
<Radio bind:selected let:select>
    {#each values.entries() as [color, { ids, isDisabeled }]}
        {#if isDisabeled}
            <Tooltip text="This color is not available in this configuration ">
                <button
                    class="color button-2"
                    class:selected={ids.indexOf(productId) !== -1}
                    style="--color:{color}"
                    class:disable={isDisabeled}
                    on:click={select(ids)}
                ></button>
            </Tooltip>
        {:else}
            <button
                class="color button-2"
                class:selected={ids.indexOf(productId) !== -1}
                style="--color:{color}"
                class:disable={isDisabeled}
                on:click={select(ids)}
            ></button>
        {/if}
    {/each}
</Radio>

<style lang="scss">
    .color {
        min-width: 3rem;
        min-height: 3rem;
        background-color: var(--color);
        border-color: var(--gray-8);
        border-radius: 3px;
        &.selected {
            border: 2px solid var(--indigo-10);
        }
        &.disable {
            opacity: 0.1;
        }
    }
</style>

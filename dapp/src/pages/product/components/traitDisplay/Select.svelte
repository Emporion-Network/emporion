<script lang="ts">
    import Select from "../../../../lib/Select.svelte";
    import Tooltip from "../../../../lib/Tooltip.svelte";
    export let values: Map<string, { ids: string[]; isDisabeled: boolean }>;
    export let productId: string;
    export let selected = Array.from(values.values()).find((e) => {
        return e.ids.includes(productId);
    })?.ids;

    $: selected = Array.from(values.values()).find((e) => {
        return e.ids.includes(productId);
    })?.ids;
    export let label: string;
    $: selectedLabel = Array.from(values.entries()).find(([_, { ids }]) => {
        return ids.includes(productId);
    })![0];
</script>

<div class="select">
    <h4>{label}: {selectedLabel}</h4>
    <Select bind:selected>
        <div slot="selected">
            {selectedLabel}
        </div>
        <svelte:fragment slot="options" let:select>
            {#each values.entries() as [label, { ids, isDisabeled }]}
                {#if isDisabeled}
                    <Tooltip
                        text="This option is not available in this configuration "
                    >
                        <button
                            class="button-2"
                            class:selected={ids.includes(productId)}
                            class:disable={isDisabeled}
                            on:click={select(ids)}>{label}</button
                        >
                    </Tooltip>
                {:else}
                    <button
                        class="button-2"
                        class:selected={ids.includes(productId)}
                        class:disable={isDisabeled}
                        on:click={select(ids)}>{label}</button
                    >
                {/if}
            {/each}
        </svelte:fragment>
    </Select>
</div>

<style lang="scss">
    .select {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    .button-2 {
        min-height: 3rem;
        border-radius: 5px;
        border: none !important;
        border-radius: 0;
        text-align: left;
        &.selected,
        &:hover.selected {
            border: none;
        }
        &.disable {
            opacity: 0.2;
            border: none;
        }
    }
</style>

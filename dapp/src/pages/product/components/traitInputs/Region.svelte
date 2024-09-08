<script lang="ts">
    import MultiSelect from "../../../../lib/MultiSelect.svelte";
    export let selected: string[] = [];
    import { REGIONS } from "../../../../../../shared-types/countries";
    const options = [
        { label: "All", value: "All" },
        ...REGIONS.map((e) => ({ label: e, value: e })),
    ];
</script>

<div>
    <MultiSelect {options} placeholder="Select region" bind:selected
    ></MultiSelect>
</div>

<style lang="scss">
    div {
        display: contents;
        :global(.multiselect) {
            flex: 1;
        }
    }
</style>

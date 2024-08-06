<script lang="ts">
    import type { ProductMetaData } from "../../../../../shared-types";
    import MultiSelect from "../../../lib/MultiSelect.svelte";
    import type {Option} from "../../../lib/MultiSelect.svelte";

    type Attribute = ProductMetaData["attributes"][number];

    const options:(Option&{
        value:Attribute['display_type']
    })[] = [
        {
            label:"Color",
            value:"color"
        },
        {
            label:"Switch",
            value:"switch"
        },
        {
            label:"Gallery Image",
            value:"image"
        },
        {
            label:"Region",
            value:"region"
        },
        {
            label:"Radio image",
            value:"radio-image"
        },
        {
            label:"Radio button",
            value:"radio-button"
        },
        {
            label:"Select",
            value:"select"
        }
    ];
    export let value:Attribute['display_type']='color';
    export let disabled = false;
    let selected:Attribute['display_type'][] = [value];

    $:value = selected[0];
</script>
<MultiSelect {disabled} options={options} max={1} bind:selected={selected}></MultiSelect>
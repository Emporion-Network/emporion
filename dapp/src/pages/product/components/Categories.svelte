<script lang="ts">
    import MultiSelect from "../../../lib/MultiSelect.svelte";
    import {CATEGORIES} from "../../../../../shared-types/categories";
    export let selected:string[] = [];
    export let disabled:boolean = false;
</script>

<MultiSelect {disabled} searchable options={CATEGORIES.slice(1)} placeholder="Select product categorie" bind:selected></MultiSelect>
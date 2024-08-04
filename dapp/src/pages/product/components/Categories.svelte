<script lang="ts">
    import MultiSelect from "../../../lib/MultiSelect.svelte";
    import {CATEGORIES} from "../../../../../shared-types/categories";
    export let selected:string[] = [];
</script>

<MultiSelect options={CATEGORIES.slice(1)} placeholder="Select product categorie" bind:selected></MultiSelect>
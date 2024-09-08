<script lang="ts">
    import type { Attribute } from "../../../../../shared-types";
    export let attributes: Attribute[];
    const displayable: [string, string][] = attributes
        .filter((e) => !["image", "region"].includes(e.display_type))
        .map((e) => {
            if (
                e.display_type === "color" ||
                e.display_type === "radio-image"
            ) {
                return [e.trait_type, e.value!.label];
            }
            if (e.display_type === "switch") {
                return [e.trait_type, e.value ? "yes" : "no"];
            }
            if (
                e.display_type === "radio-button" ||
                e.display_type === "select"
            ) {
                return [e.trait_type, e.value!];
            }
            return ["", ""];
        });
</script>

<div class="attributes">
    {#each displayable as attr}
        <div>
            <span>{attr[0]}:</span>
            <span>{attr[1]}</span>
        </div>
    {/each}
</div>

<style lang="scss">
    .attributes{
        display: flex;
        flex-direction: column;
        width: 100%;
        div{
            display: flex;
            span:first-of-type{
                margin-right: auto;
            }
        }
    }
</style>
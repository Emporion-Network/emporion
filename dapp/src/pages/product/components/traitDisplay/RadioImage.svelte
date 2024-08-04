<script lang="ts">
    import Radio from "../../../../lib/Radio.svelte";
    import { intersect } from "../../../../lib/utils";
    export let values:{
        value:{
            label:string,
            src:string,
        },
        productId:string,
    }[] = [];
    export let overlap:string[] = [];
    export let productId:string;

    let grouped = values.reduce((acc, c)=>{
        if(!acc.has(c.value)){
            acc.set(c.value, [c.productId])
        } else {
            acc.get(c.value)?.push(c.productId)
        }
        return acc;
    }, new Map<typeof values[number]['value'], string[]>())
    export let selected = Array.from(grouped.values()).find(v => v.includes(productId));

</script>


<Radio bind:selected="{selected}" let:selected let:select>
    {#each grouped.entries() as [val, ids]}
        <button class="button" 
        class:selected={ids === selected}
        class:disable={intersect(ids, overlap).length === 0}
        on:click={select(ids)}>
            <img src="{val.src}" alt="{val.label}">
        </button>
    {/each}
</Radio>

<style lang="scss">
    .button{
        min-height: 3rem;
    }
</style>
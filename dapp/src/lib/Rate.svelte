<script lang="ts">
    export let rating: number = -1;
    export let rate:(nb:number)=>void = (_:number)=>{}
    export let readOnly = false;
    
    const handleClick = (nb:number)=>()=>{
        if(readOnly) return;
        rating = nb;
        rate(nb);
    }
</script>

<div class="stars" class:readOnly>
    {#each {length:5} as _,i}
        <button class:selected={i <= rating} on:click={handleClick(i)}><i class="ri-star-fill"></i></button>
    {/each}
</div>

<style lang="scss">
    .stars {
        display: flex;
        width: max-content;
        &.readOnly{
            cursor: default;
        }
        button{
            background-color: transparent;
            border: none;
            border-radius: 3px;
            color: var(--gray-7);
            cursor: pointer;
            &:has(~ button:hover),
            &:hover{
                color: var(--orange-8);
            }
        }
        button.selected{
            color: var(--orange-10) !important;
        }
    }
</style>

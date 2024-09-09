<script lang="ts">
    export let rating: number = 0;
    export let rate:(nb:number)=>void = (_:number)=>{}
    export let readOnly = false;
    
    const handleClick = (nb:number)=>()=>{
        if(readOnly) return;
        if(rating === nb && nb === 1){
            rating = 0;
            rate(0)
            return;
        }
        rating = nb;
        rate(nb);
    }
</script>

<div class="stars" class:readOnly>
    {#each {length:5} as _,i}
        <button class:selected={i+1 <= rating} on:click={handleClick(i+1)}><i class="ri-star-fill"></i></button>
    {/each}
</div>

<style lang="scss">
    .stars {
        display: flex;
        width: max-content;
        &.readOnly{
            cursor: default;
            button{
                cursor: default;
                &:hover{
                    color: var(--gray-7);
                }
            }
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

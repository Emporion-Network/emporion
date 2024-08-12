<script lang="ts">
    export let qty = 1;
    export let incr = (_:MouseEvent)=>{
        qty = qty+1
    }
    export let decr = (_:MouseEvent)=>{
        qty = qty-1
    }
</script>
<div class="qty">
    <button on:click={decr}>-</button>
    <input type="text"  bind:value={qty}>
    <button on:click={incr}>+</button>
</div>

<style lang="scss">
    .qty{
        display: flex;
        border: 1px solid var(--gray-6);
        border-radius: 5px;
        input{
            color: var(--gray-12);
            width: 3ch;
            text-align: center;
            background-color: transparent;
            border: 1px solid var(--gray-6);
            border-top: none;
            border-bottom: none;

        }
        button{
            color: var(--gray-12);
            cursor: pointer;
            aspect-ratio: 1;
            width: 30px;
            border: none;
            background-color: transparent;
            border-radius: 0 5px 5px 0;
            &:first-of-type{
                border-radius: 5px 0 0 5px;
            }
        }
    }
</style>
<script lang="ts">
    type T = $$Generic
    export let selected:T;
    const select = <K extends KeyboardEvent|MouseEvent>(newValue:T)=>(e:K)=>{
        if(e instanceof KeyboardEvent && !['Enter' ,' '].includes(e.key)){
            return;
        }
        selected = newValue;
    }
</script>

<div class="radio">
    <slot {selected} {select}></slot>
</div>

<style lang="scss">
    .radio{
        padding: 1rem;
        display: flex;
        flex-wrap: wrap;
        gap:1rem;
    }
</style>
<script lang="ts">
    import { clickOutside } from "../directives";

    type T = $$Generic
    export let selected:T;
    let isOpen = false;
    const select = <K extends KeyboardEvent|MouseEvent>(newValue:T)=>(e:K)=>{
        if(e instanceof KeyboardEvent && !['Enter' ,' '].includes(e.key)){
            return;
        }
        selected = newValue;
    }

    const close = ()=>{
        isOpen = false;
    }
</script>

<div class="option" use:clickOutside={close}>
    <button class="selected input" on:click={() => (isOpen = !isOpen)}>
        <slot name="selected" {select} {selected}></slot>
        <i class={ isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
    </button>
    {#if isOpen}
    <div class="options">
        <slot name="options" {select} {selected}></slot>
    </div>
    {/if}
</div>

<style lang="scss">
    .option{
        position: relative;
        width: max-content;
    }
    .selected{
        display: flex;
        height: 3rem;
        align-items: center;
        min-width: 100px;
        padding: 0.5rem;
        background-color: var(--gray-2);
        border: 1px solid var(--gray-6);
        border-radius: 3px;
        color: var(--gray-12);
        cursor: pointer;
        &:hover{
            border: 1px solid var(--gray-7);
        }
        i{
            margin-left: auto;
        }
    }
    .options{
        display: flex;
        flex-direction: column;
        position: absolute;
        top: calc(100% + 12px);
        max-height: 300px;
        min-width: 200px;
        background-color: var(--gray-4);
        z-index: 3;
    }
</style>
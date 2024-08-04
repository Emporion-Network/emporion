<script lang="ts">
    export let isOpen = true;
    const handleClieck = ()=>{
        isOpen = !isOpen;
    }
    const handleKey = (e:KeyboardEvent)=>{
        if(['Enter', ' '].includes(e.key)){
            isOpen = !isOpen;
        }
    }
</script>
<div class="foldable" class:isOpen>
    <div class="header" on:keydown={handleKey} role="button" tabindex="0">
        <slot name="header" {isOpen} toggle={handleClieck}></slot>
    </div>
    {#if isOpen}
    <div class="content">
        <slot name="content" {isOpen}></slot>
    </div>
    {/if}
</div>


<style lang="scss">
    .foldable{
        background-color: var(--bg, var(--gray-2));
        border-radius: 5px;
        border: 1px solid var(--gray-7);
        .header{
            color: var(--gray-12);
            padding: 1rem;
            border-radius: 5px 5px 0 0;
            user-select: none;
            display: flex;
            justify-content: flex-start;
            align-items: center;
        }
        &.isOpen{
            .header{
                border-bottom: 1px solid var(--gray-7);
            }
        }
        .content{
            display: contents;
        }
    }
</style>

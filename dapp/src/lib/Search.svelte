<script lang="ts">
    import { clickOutside } from "./directives";
    type Suggestion = string|{label:string, value:string};
    export let value = "";

    export let suggestions:Suggestion[] = [];
    export let placeholder:string="";
    export let icon:string|undefined = undefined;
    export let onSelect = (v:string)=>{};
    let isOpen = false;
    const handleClose = ()=>{
        isOpen = false;
    }
    const setValue = (newv:Suggestion)=>()=>{
        value = typeof newv === 'string' ? newv : newv.label;
        isOpen = false;
        onSelect(typeof newv === 'string' ? value : newv.value);
    }
    const matches = (str1:Suggestion, str2:string)=>{
        if(typeof str1 !== 'string'){
            return true;
        }
        return str1.toLowerCase().includes(str2.toLowerCase())
    }
    const handleEnter = (e:KeyboardEvent)=>{
        if(e.key !== 'Enter') return;
        onSelect(value)
        isOpen = false;
    }
</script>
<div class="search input" class:isOpen use:clickOutside={handleClose}>
    <div class="ipt">
        {#if icon}
            <i class="{icon}"></i>
        {/if}
        <input type="text" on:keydown={handleEnter} bind:value={value} on:focus={()=>isOpen = true} {placeholder}>
    </div>
    {#if suggestions.length > 0 && isOpen}
    <div class="suggestions">
        {#each suggestions as suggestion}
            {#if matches(suggestion, value)}
                <button on:click={setValue(suggestion)}>{typeof suggestion == 'string' ? suggestion : suggestion.label}</button>
            {/if}
        {/each}
    </div>
    {/if}
</div>

<style lang="scss">
    .search{
        display: flex;
        flex-direction: column;
        border-radius: 3px;
        border: 1px solid var(--gray-6);
        background-color: var(--gray-2);
        position: relative;
        &:hover{
            border: 1px solid var(--gray-7);
        }
        &.isOpen{
            z-index: 99;
        }
        .ipt{
            display: flex;
            width: 100%;
            color:var(--gray-12);
            align-items: center;
            height: 100%;
            i{
                margin-left: 1rem;
            }
        }
        input{
            height: 3rem;
            background-color: transparent;
            outline: none;
            border: none;
            color: var(--gray-12);
            text-align: start;
            padding: 0 1rem;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            font-weight: 600;
            flex: 1;
        }

        .suggestions {
            position: absolute;
            display: flex;
            flex-direction: column;
            width: calc(100% + 8px);
            top: calc(100% + 12px);
            left: -4px;
            max-height: 300px;
            overflow: auto;
            background-color: var(--gray-3);
            border-radius: 2px;
            box-shadow: 1px -2px 12px var(--black-a6);

            button {
                cursor: pointer;
                min-height: 3rem;
                background-color: transparent;
                outline: none;
                border: none;
                color: var(--gray-12);
                text-align: start;
                padding: 0 1rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                &:disabled {
                    color: var(--gray-6);
                    &:hover {
                        background-color: transparent;
                    }
                }
                &:focus {
                    background-color: var(--gray-4);
                }
                &:hover {
                    background-color: var(--gray-4);
                }
            }
        }
    }
</style>
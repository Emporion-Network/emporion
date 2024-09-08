<script lang="ts" context="module">
    export type Option = {
        label: string;
        value: string;
    };
</script>

<script lang="ts">
    import { clickOutside } from "../directives";

    export let selected: string[] = [];
    export let options: Option[] = [];
    export let max = 5;
    export let placeholder = "";
    export let disabled:boolean = false;
    export let searchable = false;

    let search = "";

    let isOpen = false;
    let valueEl: HTMLElement;

    const handleClick = (option: Option) => () => {
        if (max == 1) {
            if (selected.includes(option.value)) {
            } else {
                selected = [option.value];
            }
            isOpen = false;
            return;
        }
        if (selected.includes(option.value)) {
            selected = selected.filter((o) => o !== option.value);
        } else {
            selected.push(option.value);
            selected = selected;
        }
    };

    const getSelected = (selected: string[]) => {
        let s = options
            .filter((e) => selected.includes(e.value))
            .map((e) => e.label);
        if (s.length == 0) {
            return placeholder;
        }
        let maxw = valueEl?.getBoundingClientRect().width || 10;
        let i = 0;
        let ret = 0;
        while(true){
            if(!s[i]) break;
            if(ret*20 > maxw){
                break;
            }
            ret += s[i].length
            i++;
        }
        if (i == s.length) {
            return s.join(", ");
        }
        return s.slice(0, i).join(", ") + ` +${s.length - i} more`;
    };

    const close = () => {
        isOpen = false;
    };
</script>

<div class="multiselect input" class:disabled class:isOpen use:clickOutside={close}>
    <button
        class="value"
        class:placeholder={selected.length === 0}
        on:click={() => (isOpen = !isOpen)}
        bind:this={valueEl}
        {disabled}
    >
        <div>{getSelected(selected)}</div>
        <i class="ri-arrow-{isOpen ? 'up' : 'down'}-s-line"></i>
    </button>
    {#if isOpen}
        <div class="options">
            {#if searchable}
            <div class="search">
                <i class="ri-search-line"></i>
                <input placeholder="Search..." bind:value={search}>
            </div>
            {/if}
            {#each options as option (option.value)}
                {#if option.label.toLocaleLowerCase().startsWith(search.toLocaleLowerCase())}
                <button
                    class:selected={selected.includes(option.value)}
                    disabled={max !== 1 &&
                        !selected.includes(option.value) &&
                        selected.length == max}
                    on:click={handleClick(option)}
                >
                    {#if max > 1}
                        <div class="checkbox"></div>
                    {/if}
                    <span>{option.label}</span>
                </button>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .multiselect {
        display: flex;
        flex-direction: column;
        position: relative;
        border-radius: 3px;
        border: 1px solid var(--gray-6);
        background-color: var(--gray-2);
        &.isOpen {
            z-index:99;
        }
        &:hover {
            border-color: var(--gray-7);
        }
        &.disabled{
            opacity: 0.3;
            cursor: default;
            &:hover {
                border: 1px solid var(--gray-6);
            }
        }

        .search{
            display: flex;
            width: 100%;
            gap: 1rem;
            justify-content: center;
            align-items: center;
            position: sticky;
            top: 0;
            background-color: var(--gray-3);
            border-bottom: 1px solid var(--gray-7);
            padding-left: 1rem;
            input{
                flex:1;
                outline: none;
                height: 3rem;
                background-color: transparent;
                border: none;
                color: var(--gray-12);
                &::placeholder{
                    color: var(--gray-9);
                }
            }
        }

        .value {
            height: 3rem;
            background-color: transparent;
            outline: none;
            border: none;
            color: var(--gray-12);
            text-align: start;
            padding: 0 1rem;
            cursor: pointer;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            font-weight: 600;
            div {
                flex: 1;
            }

            &.placeholder {
                color: var(--gray-10);
            }
        }
        .options {
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
                    .checkbox {
                        outline: 1px solid var(--gray-6);
                    }
                    &:hover {
                        background-color: transparent;
                    }
                }
                &:focus {
                    background-color: var(--gray-4);
                }
                .checkbox {
                    min-width: 0.7rem;
                    min-height: 0.7rem;
                    outline: 1px solid var(--gray-11);
                    outline-offset: 2px;
                    border-radius: 2px;
                    &:hover {
                        outline: 1px solid var(--gray-12);
                    }
                }
                &.selected {
                    .checkbox {
                        background-color: var(--gray-12);
                        outline: 1px solid var(--gray-12);
                        &:hover {
                            background-color: var(--gray-11);
                        }
                    }
                }
                &:hover {
                    background-color: var(--gray-4);
                }
            }
        }
    }
</style>

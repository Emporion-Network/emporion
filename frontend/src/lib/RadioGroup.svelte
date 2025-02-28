<script lang="ts">
  import type { Snippet } from 'svelte';

  type T = $$Generic;
  let {
    value = $bindable(),
    options,
    optionRenderer,
  }: {
    value: T
    options: T[]
    optionRenderer: Snippet<[T, boolean]>
  } = $props();
  const select = (v: T) => () => {
    value = v;
  };
</script>

<div class="radio-group">
    {#each options as option}
        {@const selected = value == option}
        <label>
            <button onclick={select(option)} class:selected aria-label={selected ? 'on' : 'off'}>
            </button>
            {@render optionRenderer(option, selected)}
        </label>
    {/each}
</div>

<style lang="scss">
    .radio-group{
        display: inline-flex;
        gap:0.5rem;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;

    }
    label{
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap:0.2rem;
        cursor: pointer;
        user-select: none;
        &:focus-within{
            color: var(--main-10);
            button:not(.selected){
                 border-color: var(--main-10);
            }
        }
        &:hover{
            color: var(--main-10);
        }
    }
    button{
        cursor: pointer;
        height: var(--height-1) !important;
        width: var(--height-1) !important;
        aspect-ratio: 1/1;
        border-radius: 50%;
        border: 1px solid var(--neutral-8);
        position: relative;
        background-color: transparent;
        outline: none;

        &::after{
            content: "";
            display: block;
            width: 100%;
            height: 100%;
            position: absolute;
            top:0;
            left:0;
            border-radius: 50%;
            border: 1px solid transparent;
            box-sizing: border-box;
            transition: border 100ms ease-in-out;
        }
        &.selected{
            border-color: var(--neutral-12);
            &::after{
                border: 5px solid var(--neutral-12);
            }
        }
    }
</style>

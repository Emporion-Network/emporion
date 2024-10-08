<script lang="ts">
    import { onMount } from "svelte";
    export let rows: T[];
    export let index: keyof T;
    export let filter: (a: T) => boolean = (a: T) => true;
    let sorts = new Map<(a: T, b: T) => number, number>();
    type T = $$Generic;

    let og = [...rows];
    let headEl: HTMLElement;
    let nbRows = 0;

    $: rows = [...og]
        .sort((a, b) => {
            return Array.from(sorts.entries()).reduce((acc, [s, dir]) => {
                return acc || dir * s(a, b);
            }, 0);
        })
        .filter(filter);

    const sort = (fn: (a: T, b: T) => number) => {
        if (sorts.get(fn) === -1) {
            sorts.set(fn, 0);
        } else if (sorts.get(fn) === 1) {
            sorts.set(fn, -1);
        } else {
            sorts.set(fn, 1);
        }
        sorts = sorts;
    };

    onMount(() => {
        nbRows = headEl.children.length;
    });
</script>

<div class="table" style="--nb:{nbRows}">
    <div class="head" bind:this={headEl}>
        <slot name="head" {sort} {sorts}></slot>
    </div>
    <div class="body">
        {#each rows as row (row[index])}
            <div class="row">
                <slot name="item" item={row}></slot>
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .table {
        display: flex;
        flex-direction: column;
        color: var(--gray-12);
        border-left: 1px solid var(--gray-6);
        border-right: 1px solid var(--gray-6);
        border-radius: 3px;
        .head {
            display: flex;
            border-bottom: 1px solid var(--gray-6);
            background-color: var(--gray-2);
            border-radius: 3px 3px 0 0;
            border-top: 1px solid var(--gray-6);
            min-height: 3rem;

            :global(> *) {
                min-width: calc(100% / var(--nb));
                flex: 1 1 0px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
        .body {
            display: flex;
            flex-direction: column;
            .row {
                display: flex;
                border-bottom: 1px solid var(--gray-6);
                min-height: 3rem;
                &:last-of-type {
                    border-radius: 3px;
                }
                :global(> *) {
                    min-width: calc(100% / var(--nb));
                    flex: 1 1 0px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            }
        }
    }
</style>

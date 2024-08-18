<script lang="ts">
    import { tick } from "svelte";
    import { wait } from "../utils";
    let n: string;
    let e: HTMLElement;

    export const set = async (title: string, ms:number) => {
        n = '';
        await tick()
        n = title;
        await tick()
        let words = Array.from(e.children) as HTMLElement[];
        let w = Math.max(ms/words.length, 1);
        for await (const word of words) {
            word.style.setProperty('--opacity', "1");
            await wait(w);
        }
    };
</script>

<h2 class="title" bind:this={e}>
    {#if n !== undefined}
       {#each n.split(' ') as word}
        <span>{word} </span>
       {/each}
    {/if}
</h2>

<style lang="scss">
    .title{
        color: #fff;
        span{
            opacity: var(--opacity, 0.2);
            transition: opacity 100ms ease-in;
        }
    }
</style>

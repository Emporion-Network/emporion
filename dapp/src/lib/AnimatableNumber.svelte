<script lang="ts">
    import { tick } from "svelte";
    import { scrollTo } from "../utils";
    let n: number;
    let e: HTMLElement;

    export const set = async (nb: number, ms:number) => {
        n = nb;
        await tick()
        let itms = Array.from(e.children) as HTMLElement[];
        return Promise.all(
            n
                .toString()
                .split("")
                .map((d, i) => {
                    if (d !== ".") {
                        const dt = parseInt(d);
                        const el = itms[i].children[dt] as HTMLElement;
                        return scrollTo(el, ms, "top");
                    }
                }),
        );
    };
</script>

<div class="number" bind:this={e}>
    {#if n !== undefined}
        {#each n.toString().split("") as d}
            {#if d === "."}
                <div class="dot">.</div>
            {:else}
                <div class="digit">
                    {#each { length: 10 } as _, dgt}
                        <div>{dgt}</div>
                    {/each}
                </div>
            {/if}
        {/each}
    {/if}
</div>

<style lang="scss">
    .number {
        display: flex;
        height: var(--h);
        font-size: var(--fs);
        color: white;
        .dot {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .digit {
            display: flex;
            overflow: hidden;
            flex-direction: column;
            max-height: var(--h);
            min-height: var(--h);
            div {
                min-height: var(--h);
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }
</style>

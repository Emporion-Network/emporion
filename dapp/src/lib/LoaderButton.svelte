<script lang="ts">
    let className = "";
    export { className as class };
    export let disabled = false;
    export let onClick: (e: MouseEvent) => void = async (_: MouseEvent) => {};
    let load = false;
    const handleClick = async (e: MouseEvent) => {
        load = true;
        try{
            await onClick(e);
        } catch (e){
            console.log(e);
        }
        load = false;
    };
</script>

<button class={className} on:click={handleClick} disabled={disabled || load} >
    {#if !load}
        <slot></slot>
    {:else}
        <i class="ri-loader-4-line"></i>
    {/if}
</button>

<style lang="scss">
    i {
        &::before {
            display: block;
            animation: rotate 1s linear infinite;
            @keyframes rotate {
                from {
                    rotate: 0deg;
                }
                to {
                    rotate: 360deg;
                }
            }
        }
    }
</style>

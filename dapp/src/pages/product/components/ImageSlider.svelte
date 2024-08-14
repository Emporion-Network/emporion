<script lang="ts">
    export let imgs: string[] = [];
    let currIdx = 0;
</script>

<div class="image-slider">
    <div class="show">
        {#if imgs[currIdx - 1]}
            <button class="nav l" on:click={() => currIdx--}>
                <i class="ri-arrow-left-wide-line"></i>
            </button>
        {/if}
        {#if imgs[currIdx]}
            <img src={imgs[currIdx]} alt="" />
        {:else}
            <i class="ri-image-fill"></i>
        {/if}
        {#if imgs[currIdx + 1]}
            <button class="nav r" on:click={() => currIdx++}>
                <i class="ri-arrow-right-wide-line"></i>
            </button>
        {/if}
    </div>
    {#if imgs.length > 1}
    <div class="previews">
        {#each imgs as url, i}
            <button class:selected={currIdx == i} on:click={()=>currIdx = i}>
                <img src={url} alt="" />
            </button>
        {/each}
    </div>
    {/if}
</div>

<style lang="scss">
    .image-slider {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        .show {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            img{
                width: 100%;
                height: 100%;
                position: absolute;
                object-fit: cover;
            }
            .nav{
                position: absolute;
                background-color: transparent;
                border: none;
                color: var(--gray-1);
                z-index: 2;
                text-shadow: -1px 0 var(--gray-12), 0 1px var(--gray-12), 1px 0 var(--gray-12), 0 -1px var(--gray-12);
                top: 50%;
                transform: translateY(-50%);
                cursor: pointer;
                opacity: 0;
                pointer-events: none;
                &.l{
                    left: 0;
                }
                &.r{
                    right: 0%;
                }
            }
            i {
                font-size: 5rem;
                color: var(--gray-3);
            }
        }
        &:hover{
            .previews{
                transform: translateY(0);
            }
            .nav{
                opacity: 1;
                pointer-events: all;
            }
        }
        .previews{
            height: 80px;
            position: absolute;
            display: flex;
            max-width: calc(100% - 1rem);
            overflow-y: auto;
            gap:1rem;
            bottom: 0.5rem;
            left: 1rem;
            transform: translateY(150%);
            transition: transform 200ms ease-in-out;
            button{
                width: 80px;
                height: 80px;
                border: 1px solid var(--gray-7);
                border-radius: 3px;
                overflow: hidden;
                cursor: pointer;
                background-color: var(--gray-1);
                &.selected{
                    border: 1px solid var(--indigo-10);
                }
            }
        }
    }
</style>

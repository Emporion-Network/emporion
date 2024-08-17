<script lang="ts">
    import Input from "../../../../lib/Input.svelte";
    export let pickImage: (selected:string|undefined)=>Promise<string|undefined> = async (_:string|undefined)=>undefined;
    export let value:{
        src:string|undefined,
        label:string,
    } = {
        src:"",
        label:""
    };

    const handleClick = async () => {
        value.src = await pickImage(value.src);
    };
</script>

<div class="wpr">
    <button class="image-select" class:withImage={!!value.src} on:click={handleClick}>
        {#if value.src}
            <img src={value.src} alt="" />
        {:else}
            <i class="ri-image-add-line"></i>
        {/if}
    </button>
    <Input bind:value={value.label} placeholder="Image label"/>
</div>

<style lang="scss">
    .wpr{
        display: flex;
        gap:1rem;
        justify-items: flex-start;
    }
    .image-select {
        height: 3rem;
        width: 3rem;
        background-color: var(--gray-2);
        border: 1px solid var(--gray-6);
        color: var(--gray-12);
        border-radius: 3px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        &:hover {
            border: 1px solid var(--gray-7);
            &.withImage {
                &::after {
                    width: 100%;
                    height: 100%;
                    font-family: "remixicon" !important;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: var(--gray-12);
                    position: absolute;
                    left: 0;
                    top: 0;
                    content: "\EFE0";
                    background-color: var(--black-a7);
                }
            }
        }
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
</style>



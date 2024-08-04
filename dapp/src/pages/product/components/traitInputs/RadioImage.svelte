<script lang="ts">
    import Input from "../Input.svelte";
    import { uploadImage } from "../../../../lib/utils";
    
    export let value:{
        src:string,
        label:string,
    } = {
        src:"",
        label:""
    };
    export let img: Awaited<ReturnType<typeof uploadImage>>[0];
    const handleClick = async () => {
        img = (await uploadImage(false))[0];
    };
</script>

<button class="image-select" class:withImage={!!img} on:click={handleClick}>
    {#if img}
        <img src={img.url} alt="" />
    {:else}
        <i class="ri-image-add-line"></i>
    {/if}
</button>

<Input bind:value={value.label} placeholder="Image label"/>


<style lang="scss">
    .image-select {
        height: 3rem;
        aspect-ratio: 1;
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



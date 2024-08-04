<script lang="ts">
    import { uploadImage } from "../../../lib/utils";
    export let imgs: {
        url: string;
    }[] = [];
    export let multiple = false;
    let dragover = false;
    const handleKeydown = async (e: KeyboardEvent) => {
        if (["Enter", " "].includes(e.key)) {
            imgs = await uploadImage(multiple);
            console.log(imgs);
        }
    };

    const handleClick = async () => {
        imgs = await uploadImage(multiple);
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        dragover = false;
        imgs = await Promise.all(
            Array.from(e.dataTransfer?.files || [])
                .filter((e) => e.type.startsWith("image"))
                .map((e) => {
                    return new Promise<{ url: string }>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            console.log(reader.result)
                            resolve({ url: reader.result as string });
                        };
                        reader.readAsDataURL(e);
                    });
                }),
        );
        if (!multiple) {
            imgs = imgs.slice(0, 1);
        }
    };
    const setDragOver = (v:boolean)=>()=>{
        dragover = v;
    }
</script>

<div
    class="image-upload"
    on:drop={handleDrop}
    on:dragover|preventDefault={setDragOver(true)}
    on:dragleave={setDragOver(false)}
    on:dragend={setDragOver(false)}
    on:click={handleClick}
    on:keydown={handleKeydown}
    class:dragover
    role="button"
    tabindex="0"
>
    {#if imgs.length > 0}
        <img src={imgs[0].url} alt="" />
    {:else}
        <i class="ri-image-add-line"></i>
        <p>Click to upload or drag an image</p>
    {/if}
</div>

<style lang="scss">
    @use "../../../media.scss";
    .image-upload {
        flex: 2;
        aspect-ratio: 1;
        background-color: var(--gray-2);
        color: var(--gray-12);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        border-radius: 10px;
        border: 1px solid var(--gray-7);
        overflow: hidden;
        position: sticky;
        top: 3rem;
        &.dragover{
            outline: 3px solid var(--indigo-10);
            outline-offset: 3px;
        }
        @include media.for-size(phone) {
            position: relative;
            width: 100%;
            top: 0;
        }
        i {
            font-size: 2rem;
        }
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
</style>

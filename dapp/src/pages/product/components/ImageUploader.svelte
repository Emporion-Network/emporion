<script lang="ts">
    import { getImages, uploadFile, uploadImage } from "../../../lib/utils";
    import { jwt, user } from "../../../stores/user";

    export let img:string|undefined;
    let dragover = false;
    let state: "gallery" | "show" | "upload" = img ? "show" : "gallery";
    const handleKeydown = async (e: KeyboardEvent) => {
        if (["Enter", " "].includes(e.key)) {
            img = await uploadImage(jwt.get() || "");
        }
    };

    const handleClick = async () => {
        img = await uploadImage(jwt.get() || "");
        state = "show";
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        dragover = false;
        if (!e.dataTransfer?.files) return;
        const f = Array.from(e.dataTransfer?.files || []).filter((e) =>
            e.type.startsWith("image"),
        )[0];
        img = await uploadFile(f, jwt.get() || "");
        state = "show";
    };
    const setDragOver = (v: boolean) => () => {
        dragover = v;
    };
    const select = (url: string) => () => {
        img = url;
        state = "show";
    };
</script>

{#if state == "gallery" && $user?.address}
    <div class="gallery">
        {#await getImages($user?.address) then images}
            <button on:click={() => (state = "upload")}>
                <i class="ri-image-add-line"></i>
            </button>
            {#each [...images] as src}
                <button class:selected={img == src} on:click={select(src)}><img {src} alt="" /></button>
            {/each}
        {/await}
    </div>
{/if}
{#if state == "upload"}
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
        <i class="ri-image-add-line"></i>
        <p>Click or drag an image to upload</p>
        <button class="button-link" on:click={()=>state = "gallery"}>Gallery</button>
    </div>
{/if}
{#if state == "show" && img}
    <div class="image-upload"  role="button" tabindex="0" on:click={()=>state = "gallery"} on:keydown={(e)=> ["Enter", " "].includes(e.key) ? state = "gallery" : ""}>
        <img src={img} alt="" />
    </div>
{/if}

<style lang="scss">
    @use "../../../media.scss";
    .gallery {
        flex: 2;
        aspect-ratio: 1;
        background-color: var(--gray-2);
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        grid-auto-flow: row;
        align-content: start;
        overflow-y: auto;
        grid-gap: 5px;
        padding: 1rem;
        button {
            aspect-ratio: 1;
            background-color: transparent;
            border: 2px solid var(--gray-6);
            border-radius: 3px;
            overflow: hidden;
            cursor: pointer;
            color: var(--gray-12);
            &.selected {
                border: 2px solid var(--indigo-10);
            }
            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
    }
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
        padding: 1rem;
        &.dragover {
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
            position: absolute;
        }
    }
</style>

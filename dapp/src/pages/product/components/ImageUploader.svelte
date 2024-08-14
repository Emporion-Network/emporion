<script lang="ts">
    import { clickOutside, trapFocus } from "../../../lib/directives";
    import { getImages, uploadFile, uploadImage } from "../../../lib/utils";
    import { jwt, user } from "../../../stores/user";
    let isVisible = false;
    let dragover = false;
    let state: "gallery" | "upload" = "gallery";
    let selected: string = "";
    let content: HTMLElement;
    const handleKeydown = async (e: KeyboardEvent) => {
        if (["Enter", " "].includes(e.key)) {
            await uploadImage(jwt.get() || "");
            state = "gallery";
        }
    };

    const handleClick = async () => {
        await uploadImage(jwt.get() || "");
        state = "gallery";
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        dragover = false;
        if (!e.dataTransfer?.files) return;
        const f = Array.from(e.dataTransfer?.files || []).filter((e) =>
            e.type.startsWith("image"),
        );
        await uploadFile(f, jwt.get() || "");
        state = "gallery";
    };
    const setDragOver = (v: boolean) => () => {
        dragover = v;
    };
    let resolve = (url: string | undefined) => {};
    const select = (url: string) => () => {
        resolve(url == selected ? undefined : url);
        isVisible = false;
    };
    const handleClickOutside = (e: MouseEvent) => {
        if (!e.target) return;
        let t = e.target as Node;
        if (content.contains(t) || t === content) {
            return;
        }
        isVisible = false;
    };

    export const handleExit = () => {
        isVisible = false;
        resolve(undefined);
    };

    export const pick = async (url: string | undefined) => {
        selected = url || "";
        isVisible = true;
        return new Promise<string | undefined>((res) => {
            resolve = res;
        });
    };
</script>

{#if isVisible}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" use:trapFocus on:mousedown={handleClickOutside}>
        <div class="content" bind:this={content}>
            <button
                class="button-3-2 close"
                on:click={() => (isVisible = false)}
            >
                <i class="ri-close-line"></i>
            </button>
            {#if state == "gallery" && $user?.address}
                <div class="gallery">
                    {#await getImages($user?.address) then images}
                        <button on:click={() => (state = "upload")}>
                            <i class="ri-image-add-line"></i>
                        </button>
                        {#each [...images] as src}
                            <button
                                class:selected={selected == src}
                                on:click={select(src)}
                                ><img {src} alt="" /></button
                            >
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
                    <p>Or</p>
                    <p>
                        Sellect from
                        <button
                            class="button-link"
                            on:click={() => (state = "gallery")}>Gallery</button
                        >
                    </p>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss">
    @use "../../../media.scss";
    .modal {
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--black-a4);
        backdrop-filter: blur(10px);
        z-index: 2;
        @include media.for-size(phone) {
            align-items: flex-end;
            .content{
                width: 100%;
                height: 90%;
                top:10%;
            }
        }
    }
    .content {
        border-radius: 5px;
        border: 1px solid var(--gray-3);
        width: 70%;
        height: 80%;
        overflow: hidden;
        position: relative;
        padding-top: 3rem;
        background-color: var(--gray-2);
        .close {
            position: absolute;
            aspect-ratio: 1;
            right: 0;
            top: 0;
            border-radius: 3px;
        }
    }
    .gallery {
        height: 100%;
        background-color: var(--gray-2);
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        @include media.for-size(phone) {
            grid-template-columns: 1fr 1fr;
           
        }
        align-content: start;
        grid-auto-flow: dense;
        overflow: auto;
        grid-gap: 5px;
        padding: 1rem;
        top: 3rem;

        button {
            width: 100%;
            aspect-ratio: 1/1;
            background-color: transparent;
            border: 2px solid var(--gray-6);
            border-radius: 3px;
            cursor: pointer;
            color: var(--gray-12);
            &.selected {
                border: 2px solid var(--indigo-10);
            }
            img {
                border-radius: 2px;
                width: 100%;
                object-fit: cover;
            }
        }
    }
    .image-upload {
        height: 100%;
        background-color: var(--gray-2);
        color: var(--gray-12);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        overflow: hidden;
        top: 3rem;
        padding: 1rem;
        i {
            font-size: 2rem;
        }
        &.dragover {
            outline: 3px solid var(--indigo-10);
            outline-offset: 3px;
        }
    }
</style>

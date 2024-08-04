<script lang="ts" context="module">
    import type { ProductMetaData } from "../../../../../shared-types";
    export type Attribute = ProductMetaData["attributes"][number] & {
        key: string;
    };
</script>

<script lang="ts">
    import type { ComponentType } from "svelte";
    import Foldable from "../../../lib/Foldable.svelte";
    import Switch from "./traitInputs/Switch.svelte";
    import Color from "./traitInputs/Color.svelte";
    import { id } from "../../../lib/utils";
    import Input from "./Input.svelte";
    import TraitTypePicker from "./TraitTypePicker.svelte";
    import Image from "./traitInputs/Image.svelte";
    import Region from "./traitInputs/Region.svelte";
    import RadioImage from "./traitInputs/RadioImage.svelte";
    import RadioButton from "./traitInputs/RadioButton.svelte";

    export let attributes: Attribute[] = [];

    const traitToComponent: Record<Attribute["display_type"], ComponentType> = {
        color: Color,
        switch: Switch,
        image: Image,
        region: Region,
        "radio-image": RadioImage,
        "radio-button": RadioButton,
        select: Color,
    };

    const addAttribute = () => {
        attributes.push({
            trait_type: "",
            display_type: traitToAdd,
            value: undefined,
            key: id(),
        });
        attributes = attributes;
    };

    function removeAttribute(a: Attribute){
        return (ev: MouseEvent) => {
            let btn = ev.currentTarget as HTMLElement;
            if (!btn.classList.contains('clicked')) {
                btn.classList.add("clicked");
                setTimeout(() => {
                    btn?.classList.remove("clicked");
                }, 3000);
                return;
            }
            attributes = attributes.filter((e) => e != a);
        };
    };
    let traitToAdd: Attribute["display_type"];

    const traitToLabel: Record<Attribute["display_type"], string> = {
        color: "Add a color",
        image: "Add image gallery",
        "radio-button": "Add a radio button",
        "radio-image": "Add a radio image",
        switch: "Add a switch",
        region: "Add a region",
        select: "Add a Select",
    };
</script>

<Foldable>
    <div slot="header" class="attribute-title" let:isOpen let:toggle>
        <i class="ri-price-tag-3-line"></i>
        <div>Attributes</div>
        <button class="button-ghost" on:click={toggle}>
            <i class="ri-arrow-{isOpen ? 'up' : 'down'}-s-line"></i>
        </button>
    </div>
    <div class="attributes" slot="content">
        {#if attributes.length}
            {#each attributes as attribute (attribute.key)}
                <div class="wrpr">
                    <svelte:component
                        this={traitToComponent[attribute.display_type]}
                        bind:value={attribute.value}
                    ></svelte:component>
                    <Input
                        bind:value={attribute.trait_type}
                        placeholder="Attribute name"
                    />
                    <button
                        class="button-2 del{''}"
                        on:click={removeAttribute(attribute)}
                    >
                        <i class="ri-delete-bin-7-line"></i>
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            {/each}
        {:else}
            <p>No attributes</p>
        {/if}
        <div class="wrpr">
            <TraitTypePicker bind:value={traitToAdd}></TraitTypePicker>
            <button class="button-2 create" on:click={addAttribute}
                >{traitToLabel[traitToAdd]}</button
            >
        </div>
    </div>
</Foldable>

<style lang="scss">
    .attribute-title {
        font-size: 1.2rem;
        font-weight: bold;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex: 1;
        div {
            flex: 1;
            margin-left: 1rem;
        }
    }
    .attributes {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        border-radius: 5px;
        p {
            color: var(--gray-11);
            padding: 1rem;
            text-align: center;
        }
        .del {
            height: 3rem;
            &.clicked {
                i:first-of-type {
                    display: none;
                }
                i:nth-of-type(2) {
                    display: block;
                }
            }
            i:first-of-type {
                display: block;
            }
            i:nth-of-type(2) {
                display: none;
            }
            &:hover {
                color: var(--red-11);
                border-color: var(--red-11);
            }
        }
    }
    .wrpr {
        display: flex;
        gap: 1rem;
        align-items: center;
        .create {
            height: 3rem;
        }
    }
</style>

<script lang="ts" context="module">
    import type { ProductMetaData } from "../../../../../shared-types";
    export type Attribute = ProductMetaData["attributes"][number] & {
        key?: string;
    };
</script>

<script lang="ts">
    import type { ComponentType } from "svelte";
    import Foldable from "../../../lib/Foldable.svelte";
    import Switch from "./traitInputs/Switch.svelte";
    import Color from "./traitInputs/Color.svelte";
    import { id, swap } from "../../../lib/utils";
    import Input from "../../../lib/Input.svelte";
    import TraitTypePicker from "./TraitTypePicker.svelte";
    import Region from "./traitInputs/Region.svelte";
    import RadioImage from "./traitInputs/RadioImage.svelte";
    import RadioButton from "./traitInputs/RadioButton.svelte";
    import Drag from "../../../lib/Drag.svelte";
    import Draggable from "../../../lib/Draggable.svelte";

    export let attributes: Attribute[] = [];
    export let disableNames = false;
    export let pickImage: (
        selected: string | undefined,
    ) => Promise<string | undefined>;

    const traitToComponent: Partial<
        Record<Attribute["display_type"], ComponentType>
    > = {
        color: Color,
        switch: Switch,
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

    function removeAttribute(a: Attribute) {
        return (ev: MouseEvent) => {
            let btn = ev.currentTarget as HTMLElement;
            if (!btn.classList.contains("clicked")) {
                btn.classList.add("clicked");
                setTimeout(() => {
                    btn?.classList.remove("clicked");
                }, 3000);
                return;
            }
            attributes = attributes.filter((e) => e != a);
        };
    }
    let traitToAdd: Attribute["display_type"];

    const traitToLabel: Partial<Record<Attribute["display_type"], string>> = {
        color: "Add a color",
        "radio-button": "Add a radio button",
        "radio-image": "Add a radio image",
        switch: "Add a switch",
        region: "Add a region",
        select: "Add a Select",
    };

    const swapAttributes = (a: number, b: number) => {
        swap(attributes, a, b);
        attributes = attributes;
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
            <Drag let:swap onSwap={swapAttributes}>
                {#each attributes as attribute, i (attribute.key)}
                    {#if traitToComponent[attribute.display_type]}
                        <Draggable {swap} let:dragger let:moving>
                            <div class="wrpr" class:moving>
                                <button use:dragger class="dragger">
                                    <i class="ri-draggable" />
                                </button>
                                <div class="inputs">
                                    <Input
                                        bind:value={attribute.trait_type}
                                        placeholder="Attribute name"
                                        disabled={disableNames}
                                    />
                                    <svelte:component
                                        this={traitToComponent[
                                            attribute.display_type
                                        ]}
                                        {...attribute.display_type ==
                                        "radio-image"
                                            ? { pickImage }
                                            : {}}
                                        bind:value={attribute.value}
                                    ></svelte:component>
                                </div>
                                <button
                                    class="button-2 del{''}"
                                    on:click={removeAttribute(attribute)}
                                    disabled={disableNames}
                                >
                                    <i class="ri-delete-bin-7-line"></i>
                                    <i class="ri-close-line"></i>
                                </button>
                            </div>
                        </Draggable>
                    {/if}
                {/each}
            </Drag>
        {:else}
            <p>No attributes</p>
        {/if}
        <div class="wrpr last">
            <TraitTypePicker bind:value={traitToAdd} disabled={disableNames}
            ></TraitTypePicker>
            <button
                class="button-2 create"
                disabled={disableNames}
                on:click={addAttribute}
            >
                {traitToLabel[traitToAdd]}
            </button>
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
            &:hover:not(&:disabled) {
                color: var(--red-11);
                border-color: var(--red-11);
            }
        }
    }
    .wrpr {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: flex-start;
        padding: 1rem;
        border-bottom: 1px solid var(--gray-6);
        background-color: var(--gray-2);
        &.moving {
            cursor: grabbing;
            border-top: 1px solid var(--gray-6);
            .dragger {
                cursor: grabbing;
            }
        }
        .dragger {
            background-color: transparent;
            color: var(--gray-11);
            border: none;
            cursor: grab;
        }
        .inputs {
            min-width: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .create {
            height: 3rem;
        }
        &.last {
            border-radius: 0 0 5px 5px;
        }
    }
</style>

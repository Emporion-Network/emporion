<script lang="ts">
    import type { ComponentType } from "svelte";
    import {
        displayables,
        type Displayable,
        type ProductMetaData,
    } from "../../../../../shared-types";
    import type { Attribute } from "./AttributesMaker.svelte";
    import Color from "./traitDisplay/Color.svelte";
    import RadioButton from "./traitDisplay/RadioButton.svelte";
    import RadioImage from "./traitDisplay/RadioImage.svelte";
    import Switch from "./traitDisplay/Switch.svelte";
    import { eq, intersect, Map2, LMap } from "../../../lib/utils";

    const traitToComponent: Record<Displayable, ComponentType> = {
        color: Color,
        "radio-button": RadioButton,
        "radio-image": RadioImage,
        select: RadioImage,
        switch: Switch,
    };

    export let products: ProductMetaData[] = [];

    export let selectedProductId: string;
    type AttributeMap = Map2<
        string,
        Displayable,
        LMap<Attribute["value"], { ids: string[]; isDisabeled: boolean }>
    >;
    let attributes: AttributeMap = new Map2();
    $: if (selectedProductId) {
        attributes = new Map2();
        const selectedAttrs = new Map2<string, Displayable, boolean>();
        products
            .find((p) => p.id === selectedProductId)
            ?.attributes.forEach((a) => {
                const isDisplayable = a.display_type as Displayable;
                if (!displayables.includes(isDisplayable)) return;
                selectedAttrs.set([a.trait_type, isDisplayable], true);
            });
        products.forEach((p) => {
            p.attributes.forEach((a) => {
                const isDisplayable = a.display_type as Displayable;
                if (selectedAttrs.has([a.trait_type, isDisplayable])) {
                    if (!attributes.has([a.trait_type, isDisplayable])) {
                        attributes.set(
                            [a.trait_type, isDisplayable],
                            new LMap(),
                        );
                    }
                    if (
                        !attributes
                            .get([a.trait_type, isDisplayable])
                            ?.has(a.value)
                    ) {
                        attributes
                            .get([a.trait_type, isDisplayable])
                            ?.set(a.value, { ids: [], isDisabeled: false });
                    }
                    attributes
                        .get([a.trait_type, isDisplayable])
                        ?.get(a.value)
                        ?.ids.push(p.id);
                }
            });
        });
        if (attributes.keys().length > 1)
            attributes.keys().forEach((k0) => {
                let grouped = attributes.get(k0);
                let other = attributes
                    .keys()
                    .filter((k) => k[0] != k0[0] || k[1] != k0[1]);
                let intersected: string[] = [];
                Array.from(other).forEach((c, i) => {
                    let l =
                        Array.from(attributes.get(c)?.values() || []).find(
                            (v) => v.ids.indexOf(selectedProductId) != -1,
                        )?.ids || [];
                    if (i == 0) {
                        intersected = l;
                        return;
                    }
                    intersected = intersect(intersected, l);
                });
                if (products.length == 1) return;
                grouped?.forEach((k) => {
                    let show = intersect(intersected, k.ids).length === 0;
                    k.isDisabeled = show;
                });
            });
    }

    let selected: Record<string, Record<string, string[]>> = Object.create(
        null,
    );
    let previousSelection: Record<
        string,
        Record<string, string[]>
    > = structuredClone(selected);
    let previd = selectedProductId;
    $: selected,
        (() => {
            if (previd !== selectedProductId) {
                previd = selectedProductId;
                return;
            }
            if (!Object.keys(selected).length) return;
            let x = Object.values(selected)
                .map((e) => Object.values(e))
                .flat(1);
            let exists = x.reduce((acc, c) => {
                return intersect(acc, c);
            });
            if (exists[0] == selectedProductId) {
                previousSelection = structuredClone(selected);
                previd = selectedProductId;
                return;
            }
            if (exists[0]) {
                selectedProductId = exists[0];
                previousSelection = structuredClone(selected);
                previd = selectedProductId;
                return;
            }

            let changed: string[] | undefined = undefined;
            for (const k1 in selected) {
                for (const k2 in selected[k1]) {
                    let a = selected[k1][k2];
                    let b = previousSelection[k1][k2];
                    if (!eq(a, b)) {
                        changed = a;
                        break;
                    }
                }
            }
            if (!changed) return;
            let toSelect = changed.sort((b, a) => {
                let s = x.flat(1);
                return (
                    s.filter((e) => e != a).length -
                    s.filter((e) => e != b).length
                );
            })[0];
            selectedProductId = toSelect;
            previd = selectedProductId;
        })();
</script>

<div class="attributes">
    {#each attributes.keys() as [label, attributeType]}
        {@const _ = selected[label] = selected[label] ?? {}}
        <svelte:component
            this={traitToComponent[attributeType]}
            values={attributes.get([label, attributeType])}
            productId={selectedProductId}
            bind:selected={selected[label][attributeType]}
            {label}
        ></svelte:component>
    {/each}
</div>

<style lang="scss">
    .attributes {
        display: flex;
        flex-direction: column;
        padding: 1rem;
    }
</style>

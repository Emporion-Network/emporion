<script lang="ts">
    import type { ComponentType } from "svelte";
    import type { ProductMetaData } from "../../../../../shared-types";
    import type { Attribute } from "./AttributesMaker.svelte";
    import Color from "./traitDisplay/Color.svelte";
    import RadioButton from "./traitDisplay/RadioButton.svelte";
    import RadioImage from "./traitDisplay/RadioImage.svelte";
    import Switch from "./traitDisplay/Switch.svelte";
    import { eq, intersect, Map2, LMap } from "../../../lib/utils";

    const displayables = [
        "color",
        "radio-button",
        "radio-image",
        "select",
        "switch",
    ] as const;
    type Displayable = (typeof displayables)[number];

    const traitToComponent: Record<Displayable, ComponentType> = {
        color: Color,
        "radio-button": RadioButton,
        "radio-image": RadioImage,
        select: RadioImage,
        switch: Switch,
    };

    export let products: ProductMetaData[] = [
        {
            id: "0",
            collection_id: "0",
            name: "hello",
            image: "",
            categories: [],
            description: "product 1",
            attributes: [
                {
                    trait_type: "Color",
                    display_type: "color",
                    value: "#434343ff",
                },
                {
                    trait_type: "Size",
                    display_type: "radio-button",
                    value: "128 Gb",
                },
                {
                    trait_type: "Style",
                    display_type: "radio-button",
                    value: "S24",
                },
                {
                    trait_type:"Cover color",
                    display_type:"radio-image",
                    value:{
                        label:"Blue jean",
                        src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWPA3_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90&.v=1713911913311",
                    }
                },
                {
                    trait_type:"With 1year warenty",
                    display_type:"switch",
                    value:false,
                }
            ],
        },
        {
            id: "1",
            collection_id: "0",
            name: "hello",
            image: "",
            categories: [],
            description: "product 1",
            attributes: [
                {
                    trait_type: "Color",
                    display_type: "color",
                    value: "#434343ff",
                },
                {
                    trait_type: "Size",
                    display_type: "radio-button",
                    value: "256 Gb",
                },
                {
                    trait_type: "Style",
                    display_type: "radio-button",
                    value: "S24",
                },
                {
                    trait_type:"Cover color",
                    display_type:"radio-image",
                    value:{
                        label:"Blue jean",
                        src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWPA3_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90&.v=1713911913311",
                    }
                },
                {
                    trait_type:"With 1year warenty",
                    display_type:"switch",
                    value:true,
                }
            ],
        },
        {
            id: "2",
            collection_id: "0",
            name: "hello",
            image: "",
            categories: [],
            description: "product 1",
            attributes: [
                {
                    trait_type: "Color",
                    display_type: "color",
                    value: "#CDCBCCff",
                },
                {
                    trait_type: "Size",
                    display_type: "radio-button",
                    value: "128 Gb",
                },
                {
                    trait_type: "Style",
                    display_type: "radio-button",
                    value: "S24",
                },
                {
                    trait_type:"Cover color",
                    display_type:"radio-image",
                    value:{
                        label:"Blue jean",
                        src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWPA3_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90&.v=1713911913311",
                    }
                },
                {
                    trait_type:"With 1year warenty",
                    display_type:"switch",
                    value:false,
                }
            ],
        },
        {
            id: "3",
            collection_id: "0",
            name: "hello",
            image: "",
            categories: [],
            description: "product 1",
            attributes: [
                {
                    trait_type: "Color",
                    display_type: "color",
                    value: "#CDCBCCff",
                },
                {
                    trait_type: "Size",
                    display_type: "radio-button",
                    value: "256 Gb",
                },
                {
                    trait_type: "Style",
                    display_type: "radio-button",
                    value: "S24",
                },
                {
                    trait_type:"Cover color",
                    display_type:"radio-image",
                    value:{
                        label:"Blue jean",
                        src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWPA3_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90&.v=1713911913311",
                    }
                },
                {
                    trait_type:"With 1year warenty",
                    display_type:"switch",
                    value:true,
                }
            ],
        },
        {
            id: "4",
            collection_id: "0",
            name: "hello",
            image: "",
            categories: [],
            description: "product 1",
            attributes: [
                {
                    trait_type: "Color",
                    display_type: "color",
                    value: "#434343ff",
                },
                {
                    trait_type: "Size",
                    display_type: "radio-button",
                    value: "256 Gb",
                },
                {
                    trait_type: "Style",
                    display_type: "radio-button",
                    value: "S24+",
                },
                {
                    trait_type:"Cover color",
                    display_type:"radio-image",
                    value:{
                        label:"Blue jean",
                        src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWPA3_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90&.v=1713911913311",
                    }
                },
                {
                    trait_type:"With 1year warenty",
                    display_type:"switch",
                    value:true,
                }
            ],
        },
        {
            id: "5",
            collection_id: "0",
            name: "hello",
            image: "",
            categories: [],
            description: "product 1",
            attributes: [
                {
                    trait_type: "Color",
                    display_type: "color",
                    value: "#434343ff",
                },
                {
                    trait_type: "Size",
                    display_type: "radio-button",
                    value: "512 Gb",
                },
                {
                    trait_type: "Style",
                    display_type: "radio-button",
                    value: "S24+",
                },
                {
                    trait_type:"Cover color",
                    display_type:"radio-image",
                    value:{
                        label:"Blue jean",
                        src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWPA3_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90&.v=1713911913311",
                    }
                },
                {
                    trait_type:"With 1year warenty",
                    display_type:"switch",
                    value:true,
                }
            ],
        },
        {
            id: "6",
            collection_id: "0",
            name: "hello",
            image: "",
            categories: [],
            description: "product 1",
            attributes: [
                {
                    trait_type: "Color",
                    display_type: "color",
                    value: "#696683ff",
                },
                {
                    trait_type: "Size",
                    display_type: "radio-button",
                    value: "512 Gb",
                },
                {
                    trait_type: "Style",
                    display_type: "radio-button",
                    value: "S24+",
                },
                {
                    trait_type:"Cover color",
                    display_type:"radio-image",
                    value:{
                        label:"Blue jean",
                        src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWPC3_SW_COLOR?wid=64&hei=64&fmt=jpeg&qlt=90&.v=1713911913311",
                    }
                },
                {
                    trait_type:"With 1year warenty",
                    display_type:"switch",
                    value:true,
                }
            ],
        },
    ];

    export let selectedProductId: string;
    type AttributeMap = Map2<
        string,
        Displayable,
        LMap<Attribute["value"], {ids:string[], isDisabeled:boolean}>
    >;
    let attributes: AttributeMap = new Map2();
    $: if (selectedProductId) {
        attributes = new Map2();
        const selectedAttrs = new Map2<string,Displayable,boolean>();
        products
            .find((p) => p.id === selectedProductId)
            ?.attributes.forEach((a) => {
                const isDisplayable = a.display_type as Displayable;
                if (!displayables.includes(isDisplayable)) return;
                selectedAttrs.set([a.trait_type, isDisplayable],true);
            });
        products.forEach((p) => {
            p.attributes.forEach((a) => {
                const isDisplayable = a.display_type as Displayable;
                if (selectedAttrs.has([a.trait_type, isDisplayable])) {
                    if(!attributes.has([a.trait_type, isDisplayable])){
                        attributes.set([a.trait_type, isDisplayable],new LMap());
                    }
                    if(!attributes.get([a.trait_type, isDisplayable])?.has(a.value)){
                        attributes.get([a.trait_type, isDisplayable])?.set(a.value, {ids:[], isDisabeled:false});
                    }
                    attributes.get([a.trait_type, isDisplayable])?.get(a.value)?.ids.push(p.id);
                }
            });
        });
        if(attributes.keys().length > 1) 
        attributes.keys().forEach(k0 => {
            let grouped = attributes.get(k0);
            let other = attributes.keys().filter(k => k[0] != k0[0] || k[1] != k0[1]);
            let intersected:string[] = [];
            Array.from(other).forEach((c, i)=>{
                let l = Array.from(attributes.get(c)?.values()||[]).find(v => v.ids.indexOf(selectedProductId) != -1)?.ids||[];
                if(i == 0) {
                    intersected = l;
                    return;
                };
                intersected = intersect(intersected, l)
            })
            if(products.length == 1) return;
            grouped?.forEach(k => {
                let show = intersect(intersected, k.ids).length === 0;
                k.isDisabeled = show;
            })

        })
    }

    let selected:Record<string, Record<string, string[]>> = Object.create(null);
    let previousSelection:Record<string, Record<string, string[]>> = structuredClone(selected);
    let previd = selectedProductId;
    $: selected, (()=>{
        if(previd !== selectedProductId) {
            previd = selectedProductId;
            return;
        };
        if(!Object.keys(selected).length) return;
        let x = Object.values(selected)
        .map(e => Object.values(e)).flat(1)
        let exists = x.reduce((acc, c)=>{
            return intersect(acc,c)
        })[0];
        if(exists == selectedProductId){
            previousSelection = structuredClone(selected);
            previd = selectedProductId;
            return;
        }
        if(exists){
            selectedProductId = exists;
            previousSelection = structuredClone(selected);
            previd = selectedProductId;
            return;
        }

        let changed:string[]|undefined = undefined;
        for (const k1 in selected) {
            for (const k2 in selected[k1]) {
                let a = selected[k1][k2];
                let b = previousSelection[k1][k2];
                if(!eq(a, b)){
                    changed = a;
                    break;
                }
            }
        }
        if(!changed) return;
        let toSelect = changed.sort((b, a)=>{
            let s = x.flat(1)
            return s.filter(e => e != a).length - 
            s.filter(e => e != b).length;
        })[0];
        selectedProductId = toSelect;
        previd = selectedProductId;
    })()

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
    .attributes{
        display: flex;
        flex-direction: column;
        margin-top: 1rem;
    }
    // h4{
    //     padding: 0 1rem;
    //     font-weight: bold;
    //     color: var(--gray-11);
    // }
</style>
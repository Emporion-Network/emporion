<script lang="ts" context="module">
    let myCollections:string[] = []
    user.subscribe(async (u)=>{
        if(u?.address){
            myCollections = await getSellerCollections(u.address || "")
        }
    })
</script>


<script lang="ts">
    import { Decimal } from "@cosmjs/math";
    import { jwt, user } from "../../stores/user";
    import ImageUploader from "./components/ImageUploader.svelte";
    import Description from "./components/Description.svelte";
    import Categories from "./components/Categories.svelte";
    import PricePicker from "./components/PriceMaker.svelte";
    import Attriutes from "./components/AttributesMaker.svelte";
    import ProductShow from "./ProductShow.svelte";
    import type { AssetInfoBaseForAddr } from "../../../../client-ts/Emporion.types";
    import Tooltip from "../../lib/Tooltip.svelte";
    import Search from "../../lib/Search.svelte";
    import type { ProductMetaData } from "../../../../shared-types";
    import {
        extractAttr,
        getMetaHash,
        getProductsMeta,
        getSellerCollections,
        uploadMeta,
    } from "../../lib/utils";
    import DeliveryTime from "./components/DeliveryTime.svelte";
    const { VITE_ENDPOINT_BACK_END_API: ENDPOINT_BACK_END_API } = import.meta
        .env;

    let name: string;
    let description: string;
    let img: string | undefined;
    let categories: string[];
    let attributes: ProductMetaData["attributes"] = [];
    let price: Record<string, { amount: Decimal; info: AssetInfoBaseForAddr }> =
        {};
    let collectionId: string = "";
    let deliveryTime: number;
    let preview = false;
    const create = async () => {
        const meta: ProductMetaData = {
            id: "",
            name,
            description,
            image: img || "",
            collection_id: collectionId,
            categories: categories,
            attributes: attributes.map((a) => {
                //@ts-ignore
                delete a.key;
                return a;
            }),
        };
        const hash = getMetaHash(meta);
        console.log(hash);
        let r = await $user?.emporionClient.createProduct({
            deliveryTime: {
                time: deliveryTime,
            },
            meta: `${ENDPOINT_BACK_END_API}/hash/${hash}`,
            price: [
                {
                    amount: "10000",
                    info: {
                        native: "untrn",
                    },
                },
            ],
            isListed: true,
            metaHash: hash,
        });
        if (r == undefined) return;
        let id = extractAttr("product_id", r);
        if (!id) return;
        meta.id = id;
        console.log(id);
        const res = await uploadMeta(meta, jwt.get() || "");
    };

    $: canCreate = 
    !!img && 
    img.length > 0 && 
    collectionId.length > 0 &&
    name.length > 0 &&
    description.length > 0 &&
    categories.length > 0 &&
    Object.keys(price).length > 0;

    $:console.log(canCreate)

    let isFromExistingCollection = false;

    $:collectionId, (()=>{
        isFromExistingCollection = myCollections.includes(collectionId)
        if(isFromExistingCollection){
            presetParams(collectionId)
        }
    })()
   

    const presetParams = async (collection:string)=>{
        const metas = await getProductsMeta($user?.address||"", collection)
        if(metas.length === 0) return;
        attributes = metas[0].attributes;
        categories = metas[0].categories;
    }

</script>

<div class="action-menu">
    <Tooltip text="Preview your product">
        <button
            class="preview button-1-2"
            on:click={() => (preview = !preview)}
        >
            {#if preview}
                <i class="ri-eye-off-fill"></i>
            {:else}
                <i class="ri-eye-fill"></i>
            {/if}
        </button>
    </Tooltip>
    <button class="preview button-1-2">
        <i class="ri-more-line"></i>
    </button>
</div>
{#if !preview}
    <div class="page">
        <ImageUploader bind:img></ImageUploader>
        <div class="creation-form">
            <Description rows={2} placeholder="Product name" bind:value={name}
            ></Description>
            <Description
                rows={5}
                placeholder="Prodcut description"
                bind:value={description}
            ></Description>
            {#if $user?.address}
                {#await getSellerCollections($user?.address || "") then suggestions}
                    <Search
                        suggestions={suggestions || []}
                        bind:value={collectionId}
                        placeholder="Collection name"
                    ></Search>
                {/await}
            {/if}
            <DeliveryTime bind:value={deliveryTime}></DeliveryTime>
            <Categories disabled={isFromExistingCollection} bind:selected={categories}></Categories>
            <PricePicker bind:price></PricePicker>
            <Attriutes bind:disableNames={isFromExistingCollection} bind:attributes></Attriutes>
            <button 
            disabled={!canCreate}
            class="button-1 create" 
            on:click={create}
                >Create Product</button
            >
        </div>
    </div>
{:else}
    <ProductShow
        meta={{
            id: "-1",
            name,
            description,
            collection_id: collectionId || "some collection",
            image: img || "",
            categories,
            attributes,
        }}
        product={{
            meta: "",
            id: -1,
            delivery_time: { time: 400 },
            is_listed: true,
            price: Object.values(price).map((e) => ({
                amount: e.amount.atomics,
                info: e.info,
            })),
            rating: [4, 500],
            seller: $user?.address || "",
            meta_hash: "",
        }}
    ></ProductShow>
{/if}

<style lang="scss">
    @use "../../media.scss";
    .page {
        padding: 0 5%;
        display: flex;
        gap: 3rem;
        align-items: flex-start;
        .creation-form {
            flex: 3;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            .create {
                height: 3rem;
            }
        }

        @include media.for-size(tablet-lg) {
            flex-direction: column;
            gap: 1rem;
            .creation-form {
                width: 100%;
            }
        }
    }
    .action-menu {
        display: flex;
        gap: 0.1rem;
        justify-content: flex-end;
        padding: 0rem 5%;
        padding-bottom: 1rem;
    }
</style>

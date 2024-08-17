<script lang="ts" context="module">
    let myCollections: string[] = [];
    user.subscribe(async (u) => {
        if (u?.address) {
            myCollections = await getSellerCollections(u.address || "");
        }
    });
</script>

<script lang="ts">
    import { Decimal } from "@cosmjs/math";
    import { jwt, user } from "../../stores/user";
    import {
        extractAttr,
        getMetaHash,
        getProductsMeta,
        getSellerCollections,
        id,
        uploadMeta,
        DAY,
        trimStrings,
    } from "../../lib/utils";
    import type { ProductMetaData } from "../../../../shared-types";
    import type {
        AssetInfoBaseForAddr,
        Product,
    } from "../../../../client-ts/Emporion.types";
    const { 
        VITE_ENDPOINT_BACK_END_API: ENDPOINT_BACK_END_API 
    } = import.meta.env;
    import ImageUploader from "./components/ImageUploader.svelte";
    import Description from "./components/Description.svelte";
    import Categories from "./components/Categories.svelte";
    import PricePicker from "./components/PriceMaker.svelte";
    import Attriutes from "./components/AttributesMaker.svelte";
    import ProductShow from "./components/ProductPickerShow.svelte";
    import Tooltip from "../../lib/Tooltip.svelte";
    import Search from "../../lib/Search.svelte";
    import Menu from "../../lib/Menu.svelte";
    import Switch from "./components/traitInputs/Switch.svelte";
    import DeliveryTime from "./components/DeliveryTime.svelte";
    import { notification } from "../../lib/Notifications.svelte";
   


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
    let isListed = true;
    let isFromExistingCollection = false;
    let metas: ProductMetaData[] = [];
    let products: Product[] = [];
    let galleryImages: (string | undefined)[] = [];
    let creating = false;

    const create = async () => {
        creating = true;
        const meta: ProductMetaData = trimStrings({
            id: "",
            name:name.trim(),
            description:description,
            image: img || "",
            collection_id: collectionId,
            categories: categories,
            attributes: [
                ...attributes.map((a) => {
                    //@ts-ignore
                    delete a.key;

                    return a;
                }),
                ...galleryImages
                    .filter((e) => e !== undefined)
                    .map((e) => ({
                        value: e,
                        display_type: IMAGE_TYPE,
                        trait_type: e,
                    })),
            ],
        });
        const hash = getMetaHash(meta);
        try {
            let r = await $user?.emporionClient.create_product(
                {
                    delivery_time: {
                        time: deliveryTime,
                    },
                    meta: `${ENDPOINT_BACK_END_API}/hash/${hash}`,
                    price: Object.values(price).map((e) => ({
                        amount: e.amount.atomics,
                        info: e.info,
                    })),
                    is_listed: isListed,
                    meta_hash: hash,
                },
                "auto",
            );
            if (r == undefined) throw Error("Unknown error");
            let id = extractAttr("product_id", r);
            if (!id) throw Error("Unknown error");
            meta.id = id;
            if (await uploadMeta(meta, jwt.get() || "")) {
                clear();
            }
        } catch (e) {
            let text = "Unknown error"
            if(e instanceof Error) text = e.message.length > 20 ? text : e.message;
            notification({
                type:"error",
                text,
            })
        }

        creating = false;
    };

    const clear = () => {
        name = "";
        description = "";
        img = undefined;
        categories = [];
        attributes = [];
        price = {};
        collectionId = "";
        deliveryTime = 7 * DAY;
        isListed = true;
        galleryImages = [];
    };

    $: canCreate =
        !!img &&
        img.length > 0 &&
        collectionId.length > 0 &&
        name.length > 0 &&
        description.length > 0 &&
        categories.length > 0 &&
        Object.keys(price).length > 0;

    const IMAGE_TYPE = "image" as const;

    let pickImage: (
        selected: string | undefined,
    ) => Promise<string | undefined>;

    $: collectionId,
        (() => {
            isFromExistingCollection = myCollections.includes(collectionId);
            if (isFromExistingCollection) {
                presetParams(collectionId);
            } else {
                metas = [];
                products = [];
            }
        })();

    const presetParams = async (collection: string) => {
        metas = await getProductsMeta($user?.address || "", collection);
        if (metas.length === 0) return;
        attributes = metas[0].attributes
            .map((a) => ({ ...a, key: id() }))
            .filter((a) => a.display_type !== "image");
        categories = metas[0].categories;
        products = (
            await Promise.all(
                metas.map(({ id }) => {
                    return $user?.emporionClient.product_by_id({
                        product_id: Number(id),
                    });
                }),
            )
        ).filter((e) => e !== undefined);
    };
    const setMetaImage = async () => {
        img = await pickImage(img);
    };
    const setGalleryImage = (idx: number) => async () => {
        galleryImages[idx] = await pickImage(galleryImages[idx]);
    };
</script>

<Menu></Menu>
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
        <div class="product-images">
            <button class="main-image" on:click={setMetaImage}>
                {#if img}
                    <img src={img} alt="" />
                {:else}
                    <i class="ri-image-add-line"></i>
                {/if}
            </button>
            <div class="other-images">
                {#each { length: 10 } as _, i}
                    {@const img = galleryImages[i]}
                    <button class="gallery-img" on:click={setGalleryImage(i)}>
                        {#if img}
                            <img src={img} alt="" />
                        {:else}
                            <i class="ri-image-add-line"></i>
                        {/if}
                    </button>
                {/each}
            </div>
        </div>
        <div class="creation-form" class:creating>
            <div class="wpr">
                <Switch bind:value={isListed}></Switch>
                <Tooltip
                    text="Products can be listed or unlisted at any time. Unlisted products will not be visible to buyers."
                >
                    <i class="ri-information-line"></i>
                </Tooltip>
                <span>Listed</span>
            </div>

            <div class="label">
                <div>Product name</div>
                <Description
                    rows={2}
                    placeholder="Product name"
                    bind:value={name}
                />
            </div>
            <div class="label">
                <div>Description</div>
                <Description
                    rows={5}
                    placeholder="Prodcut description"
                    bind:value={description}
                />
            </div>

            <div class="label">
                <div>
                    Collection
                    <Tooltip
                        text="Products within the same collection will be grouped together and will share the same attributes."
                    >
                        <i class="ri-information-line"></i>
                    </Tooltip>
                </div>
                {#if $user?.address}
                    {#await getSellerCollections($user?.address || "") then suggestions}
                        <Search
                            suggestions={suggestions || []}
                            bind:value={collectionId}
                            placeholder="Collection name"
                        />
                    {/await}
                {/if}
            </div>
            <div class="label">
                <div>
                    Maximum Delivery Time
                    <Tooltip
                        text="After this period has elapsed, you are authorized to fulfill the order if the buyer has not completed the process."
                    >
                        <i class="ri-information-line"></i>
                    </Tooltip>
                </div>
                <DeliveryTime bind:value={deliveryTime} />
            </div>
            <div class="label">
                <div>Categories (max 5)</div>
                <Categories
                    disabled={isFromExistingCollection}
                    bind:selected={categories}
                />
            </div>
            <PricePicker bind:price></PricePicker>
            <Attriutes
                bind:disableNames={isFromExistingCollection}
                bind:attributes
                {pickImage}
            ></Attriutes>
            <p>
                By submitting this product, you affirm that it adheres to all
                relevant legal and regulatory requirements and complies with
                marketplace standards and guidelines.
            </p>
            <button
                disabled={!canCreate}
                class="button-1 create"
                on:click={create}
            >
                {#if creating}
                    <i class="rotate ri-loader-4-fill"></i>
                {:else}
                    Create Product
                {/if}
            </button>
        </div>
    </div>
{:else}
    <ProductShow
        metas={[
            {
                id: "-1",
                name,
                description,
                collection_id: collectionId || "some collection",
                image: img || "",
                categories,
                attributes: [
                    ...attributes,
                    ...galleryImages
                        .filter((e) => e !== undefined)
                        .map((e) => ({
                            value: e,
                            display_type: IMAGE_TYPE,
                            trait_type: e,
                        })),
                ],
            },
            ...metas,
        ]}
        products={[
            {
                meta: "",
                id: -1,
                delivery_time: { time: deliveryTime },
                is_listed: true,
                price: Object.values(price).map((e) => ({
                    amount: e.amount.atomics,
                    info: e.info,
                })),
                rating: [4, 500],
                seller: $user?.address || "",
                meta_hash: "",
            },
            ...products,
        ]}
        productId="-1"
    ></ProductShow>
{/if}

<ImageUploader bind:pick={pickImage}></ImageUploader>

<style lang="scss">
    @use "../../media.scss";
    :global(.creation-form.creating > *) {
        opacity: 0.2;
    }
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
            position: relative;
            padding-bottom: 3rem;

            .create {
                height: 3rem;
            }
            p {
                color: var(--orange-12);
                background-color: var(--orange-a2);
                padding: 1rem;
                border-radius: 5px;
                border: 1px solid var(--orange-7);
            }
        }
        .product-images {
            display: flex;
            flex: 2;
            flex-direction: column;
            overflow: hidden;
            gap: 0.5rem;
            position: sticky;
            top: 3rem;

            button {
                aspect-ratio: 1;
                border: 1px solid var(--gray-7);
                background-color: var(--gray-2);
                color: var(--gray-11);
                cursor: pointer;
                border-radius: 3px;
                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }
            .main-image {
                aspect-ratio: 1;
                font-size: 2rem;
                border-radius: 5px;
            }
            .other-images {
                height: 80px;
                overflow-y: auto;
                display: flex;
                max-width: 100%;
                gap: 0.5rem;
            }
        }
        @include media.for-size(tablet-lg) {
            flex-direction: column;
            gap: 1rem;
            .creation-form {
                width: 100%;
            }
            .product-images {
                position: relative;
                top: 0;
                width: 100%;
            }
        }
    }
    .wpr {
        display: flex;
        align-items: center;
        color: var(--gray-12);
        gap: 0.5rem;
        font-weight: 600;
        i {
            color: var(--gray-10);
        }
    }
    .label {
        display: flex;
        color: var(--gray-11);
        flex-direction: column;
        font-weight: 500;
        gap: 0.5rem;
        div {
            display: flex;
            gap: 0.5rem;
            align-items: center;
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

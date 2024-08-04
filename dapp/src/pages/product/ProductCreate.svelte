<script lang="ts">
    import { Decimal } from "@cosmjs/math";
    import Wallet from "../../lib/Wallet.svelte";
    import { user } from "../../stores/user";
    import ImageUploader from "./components/ImageUploader.svelte";
    import Description from "./components/Description.svelte";
    import Categories from "./components/Categories.svelte";
    import PricePicker from "./components/PriceMaker.svelte";
    import type { Attribute } from "./components/Attributes.svelte";
    import Attriutes from "./components/Attributes.svelte";
    import ProductShow from "./ProductShow.svelte";
    import type { AssetInfoBaseForAddr } from "../../../../client-ts/Emporion.types";

    let name: string;
    let description: string;
    let imgs: {
        file: File;
        url: string;
    }[];
    let categories: string[];
    let attributes: Attribute[] = [];
    let price: Record<string, {amount:Decimal, info:AssetInfoBaseForAddr}> = {};
    let preview = false;
    const create = async () => {
        let r = await $user?.emporionClient.createProduct({
            deliveryTime: {
                time: 123456,
            },
            meta: "",
            price: [
                {
                    amount: "10000",
                    info: {
                        native: "untrn",
                    },
                },
            ],
            isListed: true,
            metaHash: "",
        });

        console.log(r);
    };
</script>

<div class="action-menu">
    <button class="preview button-1-2" on:click={()=>preview = !preview}>
        {#if preview}
        <i class="ri-eye-off-fill"></i>
        {:else}
        <i class="ri-eye-fill"></i>
        {/if}
    </button>
    <button class="preview button-1-2">
        <i class="ri-more-line"></i>
    </button>
</div>
{#if !preview}
    <div class="page">
        <ImageUploader bind:imgs></ImageUploader>
        <div class="creation-form">
            <Description rows={2} placeholder="Product name" bind:value={name}
            ></Description>
            <Description
                rows={5}
                placeholder="Prodcut description"
                bind:value={description}
            ></Description>
            <Categories bind:selected={categories}></Categories>
            <PricePicker bind:price></PricePicker>
            <Attriutes bind:attributes></Attriutes>
            <button class="button-1 create" on:click={create}
                >Create Product</button
            >
        </div>
    </div>
{:else}
        <ProductShow
            meta={{
                id:"",
                name,
                description,
                collection_id: "",
                image: imgs[0]?.url || "",
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

        @include media.for-size(phone) {
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

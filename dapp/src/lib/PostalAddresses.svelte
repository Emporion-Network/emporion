<script lang="ts">
    import { api } from "../stores/user";
    import Radio from "./Radio.svelte";
    import TextArea from "./Title.svelte";
    import Tooltip from "./Tooltip.svelte";
    export let postalAddress: string;
    let addNew = false;

    const toggle = async () => {
        setTimeout(() => {
            /// prevent cart from closing because of lost of focus
            addNew = !addNew;
        }, 10);
    };
</script>

<div class="container">
    {#await api.postalAddressesGet() then addresses}
        <div class="header">
            <Tooltip text="Your address is not recorded on the blockchain and is only visible to the seller after you complete a purchase.">
                <i class="ri-information-line"></i>
            </Tooltip>
            <h2>Deliver to</h2>
            {#if addresses.length > 0}
                <button class="newAddress" on:click={toggle}>
                    <i
                        class={addresses.length !== 0 && !addNew
                            ? "ri-add-circle-line"
                            : "ri-close-line"}
                    ></i>
                </button>
            {/if}
        </div>
        <div class="addresses">
            {#if addresses.length !== 0 && !addNew}
                <Radio bind:selected={postalAddress} let:select let:selected>
                    {#each addresses as address}
                        <button
                            class="radio-address"
                            on:click={select(address)}
                            class:selected={selected == address}
                        >
                                {address}
                        </button>
                    {/each}
                </Radio>
            {/if}

            {#if addresses.length === 0 || addNew}
                <TextArea rows={3} placeholder="Delivery address" bind:value={postalAddress}></TextArea>
            {/if}
        </div>
    {/await}
</div>

<style lang="scss">
    .container {
        position: relative;
    }
    .addresses {
        padding: 1rem;
        display: flex;
        gap: 1rem;
        overflow-y: auto;
        position: relative;

        :global(.radio) {
            flex-wrap: nowrap;
            padding: 0;
        }

        .radio-address {
            height: 6rem;
            white-space: pre;
            text-align: start;
            background-color: transparent;
            border: 1px solid var(--gray-6);
            color: var(--gray-12);
            padding: 0.5rem;
            padding-right: 2rem;
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 1rem;
            &::before{
                display: block;
                width: 14px;
                height: 14px;
                background-color: var(--gray-6);
                border-radius: 14px;
                content: '';
            }
            &.selected{
                border-color: var(--indigo-10);
                &::before{
                    background-color: var(--indigo-10);
                    outline: 1px solid var(--indigo-10);
                    outline-offset: 2px;
                }
            }
        }
    }

    .header {
        display: flex;
        padding: 0 1rem;
        align-items: center;
        h2 {
            margin-right: auto;
            margin-left: 0.5rem;
            color: var(--gray-12);
            font-weight: 600;
        }
    }

    .newAddress {
        aspect-ratio: 1;
        height: 2rem;
        background-color: var(--gray-4);
        color: var(--gray-12);
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
</style>

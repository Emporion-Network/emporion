<script lang="ts">
    import MultiSelect from "../../../lib/MultiSelect.svelte";
    import { prices } from "../../../stores/coins";
    import { user } from "../../../stores/user";
    import { Decimal } from "@cosmjs/math";
    const { VITE_NATIVE_COIN: NATIVE_COIN } = import.meta.env;
    export let productPrices: {
        denom: string;
        amount: Decimal;
    }[];

    let showPriceIn: string = $user?.selectedCoin || NATIVE_COIN;

    $: selctedPrice =
        productPrices.find((p) => p.denom == showPriceIn) || productPrices[0];
    const options = productPrices.map((e) => ({
        label: e.denom,
        value: e.denom,
    }));
    let value = [showPriceIn];
    $: showPriceIn = value[0];
    user.subscribe((nu) => {
        if (!nu) return;
        showPriceIn = nu?.selectedCoin;
        value = [showPriceIn];
    });
</script>

<div class="price">
    <div class="small">Current price</div>
    {#if selctedPrice}
    <h2>{selctedPrice.amount.toString()}
        {showPriceIn}
        <span class='small'>≈ ${(selctedPrice.amount.toFloatApproximation() * $prices[showPriceIn].price.toFloatApproximation()).toFixed(2)}</span>
    </h2>
    <div class="wpr">
        <button class="button-1">Add to cart</button>
        <MultiSelect {options} bind:selected={value} max={1}></MultiSelect>
    </div>
    {:else}
    <h2>-</h2>
    <button class="button-1" disabled>Add to cart</button>
    {/if}

</div>

<style lang="scss">
    .price{
        background-color: var(--gray-2);
        padding: 1rem;
        border-radius: 3px;
        border: 1px solid var(--gray-6);
        display: flex;
        flex-direction: column;
        gap:0.5rem;
        margin-top: 1rem;
        .wpr{
            display: flex;
            .button-1{
                border-radius: 5px 0px 0px 5px;
                flex:1;
            }
            :global(.multiselect){
                border: none;
                border-left: 1px solid var(--gray-2);
                max-width: 20%;
            }
            :global(.multiselect .value){
                background-color: var(--indigo-9);
                border-radius: 0 5px 5px 0;
                &:hover{
                    background-color: var(--indigo-10);
                }
            }
        }
    }
    .small{
            font-size: 1rem;
            color: var(--gray-10);
        }
    h2{
        font-size: 2.3rem;
        
    }
    .button-1 {
        width: 100%;
    }
</style>

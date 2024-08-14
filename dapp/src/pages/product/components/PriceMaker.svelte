<script lang="ts">
    import type { AssetInfoBaseForAddr } from "../../../../../client-ts/Emporion.types";
    import AmountInput from "../../../lib/AmountInput.svelte";
    import Foldable from "../../../lib/Foldable.svelte";
    import MultiSelect from "../../../lib/MultiSelect.svelte";
    import Tooltip from "../../../lib/Tooltip.svelte";
    import { prices } from "../../../stores/coins";
    import { Decimal } from "@cosmjs/math";

    export let price:Record<string, {amount:Decimal, info:AssetInfoBaseForAddr}> = {};
    const options = Object.values($prices).map((e) => ({
        value: e.coinDenom,
        label: e.coinDenom,
    }));
    let acceptedCurrencies:string[] = Object.keys(price);
    $:acceptedCurrencies && (()=>{
        Object.keys(price).filter(e => !acceptedCurrencies.includes(e))
        .forEach(k => delete price[k]);
        price = price;
    })()
</script>

<Foldable>
    <div slot="header" class="price-title" let:isOpen let:toggle>
        <i class="ri-exchange-dollar-line"></i>
        <div>Price</div>
        <button class="button-ghost" on:click={toggle}>
            <i class="ri-arrow-{isOpen ? 'up' : 'down'}-s-line"></i>
        </button>
    </div>
    <div class="price-picker" slot="content">
        <div class="label">
            <div>
                Accepted currencies
                <Tooltip text="Select the accepted currencies and set the prices for this product. Prices can be updated later.">
                    <i class="ri-information-line"></i>
                </Tooltip>
            </div>
            <MultiSelect
            placeholder="Select accepted currencies"
            {options}
            max={Infinity}
            bind:selected={acceptedCurrencies}/>
        </div>
        <div class="prices">
            {#each acceptedCurrencies as denom (denom)}
                {@const _ = price[denom] = price[denom] ?? {info:$prices[denom].isCw20 ? {cw20:$prices[denom].onChainDenom } : {native:$prices[denom].onChainDenom}}}
                <AmountInput bind:value={price[denom].amount} checkAmout={false} label="" coinDenom={denom} useNativeAmount={false}></AmountInput>
            {/each}
        </div>
    </div>
</Foldable>


<style lang="scss">
    .price-title {
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

    .label {
        display: flex;
        color: var(--gray-11);
        flex-direction: column;
        font-weight: 500;
        gap: 0.5rem;
        div{
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
    }

    .price-picker{
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        border-radius: 5px;
        .prices{
            gap: 1rem;
            display: flex;
            flex-direction: column;
        }
    }
</style>
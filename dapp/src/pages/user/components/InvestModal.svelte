<script lang="ts">
    import { trapFocus } from "../../../directives";
    import { Decimal } from "@cosmjs/math";
    import AmountInput from "../../../lib/AmountInput.svelte";
    import Select from "../../../lib/Select.svelte";
    import { prices } from "../../../stores/coins";
    import { ENV, getOnChainDenom, rotateObj } from "../../../utils";
    import { user } from "../../../stores/user";
    import MultiSelect from "../../../lib/MultiSelect.svelte";
    import type { AssetBaseForAddr } from "../../../../../client-ts/Emporion.client";
    import LoaderButton from "../../../lib/LoaderButton.svelte";
    let contentEl: HTMLElement;
    export let isVisible = false;
    export let side: "invest" | "divest" = "invest";
    export let invested: AssetBaseForAddr[] = [];
    let investAmount: Decimal = Decimal.zero(0);
    let coin = $prices[ENV.NATIVE_COIN];

    let r = rotateObj($prices, "onChainDenom");
    const options = invested
        .map((e) => ({ ...e, denom: getOnChainDenom(e.info) }))
        .map((e) => ({
            value:r[e.denom].coinDenom,
            label: r[e.denom].coinDenom,
            amount: Decimal.fromAtomics(e.amount, r[e.denom].coinDecimals),
        }));
    let toDivest: string[] = options.map(e => e.value);
    let coins: Decimal[] = [];

    const invest = async () => {
        await $user?.emporionClient.invest({}, "auto", "", [
            {
                amount: investAmount.atomics,
                denom: coin.onChainDenom,
            },
        ]);
    };

    const divest = async () => {
        await $user?.emporionClient.divest(
            {
                to_divest: coins.map((c,i) => {
                    return {
                        info:{
                            ...($prices[toDivest[i]].isCw20 ? {
                                cw20:$prices[toDivest[i]].onChainDenom,
                            } : {
                                native:$prices[toDivest[i]].onChainDenom,
                            })
                        },
                        amount:c.atomics,
                    }
                }),
            },
            "auto",
        );
    };
    $: isDisabeled =
        investAmount.isLessThanOrEqual(
            Decimal.zero(investAmount.fractionalDigits),
        ) || coin.onChainAmount.isLessThanOrEqual(investAmount);

    const handleClickOutside = (e: MouseEvent) => {
        if (!e.target) return;
        let t = e.target as Node;
        if (contentEl.contains(t) || t === contentEl) {
            return;
        }
        isVisible = false;
    };
    $:console.log(coin)
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if isVisible}
    <div class="alert-modal" on:click={handleClickOutside} use:trapFocus>
        {#if side == "invest"}
            <div class="content" bind:this={contentEl}>
                <h1>Invest</h1>
                <Select bind:selected={coin}>
                    <div class="selected" slot="selected" let:selected>
                        <img src={selected.icon} alt={selected.coinDenom} />
                        {selected.coinDenom}
                    </div>
                    <svelte:fragment slot="options" let:select>
                        {#each Object.values($prices) as c}
                            <button
                                class="button-ghost"
                                on:click|stopPropagation={select(c)}
                            >
                                <img src={c.icon} alt={c.coinDenom} />
                                {c.coinDenom}
                            </button>
                        {/each}
                    </svelte:fragment>
                </Select>

                <AmountInput
                    bind:coinDenom={coin.coinDenom}
                    useNativeAmount={false}
                    label="Select Amount"
                    bind:value={investAmount}
                ></AmountInput>
                <p>
                    Investment Warning Before proceeding with your investment,
                    please read the following carefully:<br /> When you invest, your
                    funds will be locked for 14 days, during which you won't be able
                    to withdraw or access them. Your investment will be used to provide
                    liquidity for the platform, helping to reimburse disputed transactions.
                    In return, you'll receive a portion of the platform's fees, potentially
                    earning a profit. However, there's a risk that the funds you
                    provide could be used to cover disputes, which may result in
                    a loss of some or all of your investment if the number of disputes
                    exceeds available liquidity. By investing, you acknowledge and
                    accept these conditions. Please invest responsibly.
                </p>
                <div class="buttons">
                    <LoaderButton
                        class="button-1"
                        onClick={invest}
                        disabled={isDisabeled}>Invest</LoaderButton>
                    <button
                        on:click={() => (isVisible = false)}
                        class="button-2">Cancel</button
                    >
                </div>
            </div>
        {/if}
        {#if side === "divest"}
            <div class="content" bind:this={contentEl}>
                <h1>Divest</h1>
                <MultiSelect
                    searchable
                    placeholder="Select amount to divest"
                    {options}
                    max={Infinity}
                    bind:selected={toDivest}
                />
                {#each toDivest as coin,i}
                    <AmountInput
                        bind:coinDenom={coin}
                        useNativeAmount={true}
                        label="Select Amount"
                        bind:value={coins[i]}
                        setAvailable={options[i].amount}
                    ></AmountInput>
                {/each}
                <div class="buttons">
                    <LoaderButton
                        class="button-1"
                        onClick={divest}
                        >Divest</LoaderButton
                    >
                    <button
                        on:click={() => (isVisible = false)}
                        class="button-2">Cancel</button
                    >
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
    .alert-modal {
        background-color: var(--black-a4);
        color: var(--gray-12);
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 90;
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        outline: none;

        .content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            width: 40%;
            padding: 1rem;
            background-color: var(--gray-1);
            border-radius: 5px;
            border: 1px solid var(--gray-3);
            position: relative;
            :global(.multiselect){
                flex:1;
                width: 100%;
                height: 3rem;
            }
            :global(.option){
                flex:1;
                width: 100%;
                height: 3rem;
            }
            :global(.selected){
                width: 100%;
                height: 3rem;
            }
            :global(.option .options){
                flex:1;
                width: 100%;
            }
            :global(.option .options >button){
                min-height: 3rem;
                display: flex;
                align-items: center;
                padding-left: 0.5rem;
                gap:0.5rem;
            }
            :global(.option .selectd){
                width: 100%;
            }
            .selected {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                gap: 0.5rem;
            }
            p {
                max-height: 150px;
                overflow-y: auto;
                border: 1px solid var(--orange-6);
                padding: 0.5rem;
                background-color: var(--orange-2);
                border-radius: 3px;
                color: var(--orange-12);
            }
            img {
                width: 30px;
                height: 30px;
            }
            .buttons {
                display: flex;
                justify-content: flex-end;
                width: 100%;
                gap: 1rem;
                :global(button){
                    width: 120px;
                }
            }
        }
    }
</style>

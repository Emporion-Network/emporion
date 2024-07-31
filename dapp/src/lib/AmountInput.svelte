<script lang="ts">
    import type { FormEventHandler } from "svelte/elements";
    import { prices, type CoinData } from "../stores/coins";
    import { Decimal } from "@cosmjs/math";
    import { multiply_ratio } from "./utils";
    export let label: string;
    export let coinDenom: string;
    export let useNativeAmount: boolean;
    export let value = Decimal.zero(0);
    $:coin = $prices[coinDenom];
    $:available = useNativeAmount ? coin.nativeAmount : coin.onChainAmount;
    let amount = "";
    let tgt:HTMLInputElement;

    const onInput = (e: Parameters<FormEventHandler<HTMLInputElement>>[0]) => {
        let val = e.currentTarget.value;
        let pts = val.split(".");
        let int = (pts[0] || "0").replace(/[^0-9]/g, "");
        let rest = pts
            .slice(1)
            .join("")
            .replace(/[^0-9]/g, "");
        int = int.slice(int.match(/^[1-9]/)?.index ?? Infinity);
        int = int === '' ? '0' : int;
        rest = rest.slice(0, coin.coinDecimals);
        let fmtd = `${int}.${rest}`;
        fmtd = fmtd === '.' ? amount : fmtd;
        try {
            value = Decimal.fromUserInput(val, coin.coinDecimals);
            amount = val;
            return;
        } catch {
            e.currentTarget.value = fmtd;
        }
    };
    const getApprox = (amount: string, coin:CoinData) => {
        try {
            return (
                coin.price.toFloatApproximation() *
                Decimal.fromUserInput(
                    amount,
                    coin.coinDecimals,
                ).toFloatApproximation()
            );
        } catch {}
        return 0;
    };

    const set = (n:number, d:number)=>()=>{
        value = multiply_ratio(available, [n, d])
        tgt.value = value.toString()
    }
</script>

<div class="wrpr">
    <div class="label">
        <span>{label}</span>
        <button class="button-3" on:click={set(1, 1)}>Available {available.toString()}</button>
    </div>
    <div class="input-amount" tabindex="0" role="textbox">
        <div class="img">
            <img src={coin.icon} alt={coin.chainName} />
        </div>
        <input type="text" on:input={onInput} bind:this={tgt} />
        <div class="info">
            <span class="denom">{coin.coinDenom}</span>
            {#if getApprox(amount, coin) > 0}
                ≈
                <span class="approx">${getApprox(amount, coin).toFixed(2)}</span>
            {/if}
        </div>
    </div>
    <div class="btns">
        <button class="button-1-2" on:click={set(1, 1)}>MAX</button>
        <button class="button-1-2" on:click={set(1, 2)}>1/2</button>
        <button class="button-1-2" on:click={set(1, 3)}>1/3</button>
    </div>
</div>

<style lang="scss">
    .wrpr {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        gap: 0.5rem;
        .label {
            color: var(--gray-11);
            font-weight: 600;
            font-size: 0.8rem;
            display: flex;
            justify-content: space-between;
            width: 100%;
            align-items: end;
            span:first-of-type {
                font-size: 1.2rem;
            }
        }
        .input-amount {
            display: flex;
            padding: 0.5rem;
            padding-right: 1rem;
            border: 1px solid var(--gray-6);
            background-color: transparent;
            border-radius: 5px;
            justify-content: flex-start;
            align-items: center;
            gap: 1rem;
            color: var(--gray-10);
            position: relative;
            overflow: hidden;
            .img {
                position: absolute;
                background-color: var(--gray-2);
                aspect-ratio: 1/1;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                left: 0;
                top: 0;
                border-right: 1px solid var(--gray-6);
            }
            input {
                flex: 1;
                background-color: transparent;
                border: none;
                color: var(--gray-12);
                outline: none;
                font-weight: 700;
                height: 48px;
                padding-left: calc(48px + 1.3rem);
            }
            .denom {
                font-weight: 600;
            }
            &:hover {
                border: 1px solid var(--gray-7);
            }
            img {
                width: 40px;
            }
        }
        .btns {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 0.5rem;
            .button-1-2 {
                border-radius: 2px;
            }
        }
    }
</style>

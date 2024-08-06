<script lang="ts">
    import { prices } from "../stores/coins";
    import { Decimal } from "@cosmjs/math";
    import { user } from "../stores/user";
    import AmountInput from "./AmountInput.svelte";
    import { trapFocus } from "./directives";
    import InputAddress from "./InputAddress.svelte";
    import { caplz, ibcTransfer, toPrefix } from "./utils";
    import { notification } from "./Notifications.svelte";
    export let isVisible = false;
    export let nativeCoinDenom: string;
    export let coinDenom: string;
    export let direction: "deposit" | "withdraw";
    let prevVisible = isVisible;
    let status: "" | "error" = "";
    let errorLabel = "";

    $: nativeCoin = $prices[nativeCoinDenom];
    $: coin = $prices[coinDenom];
    let disabeled = false;

    const transfer = async () => {
        disabeled = true;
        try {
            let tx = await ibcTransfer(direction)(
                nativeCoin,
                coin,
                transferAmount,
            );
            if (isVisible) {
                isVisible = false;
            }
            notification({
                type: "success",
                text: `Transaction successful`,
                url:
                    direction === "deposit"
                        ? coin.blockExplorerUrl.replace(
                              "TX_HASH",
                              tx?.transactionHash || "",
                          )
                        : nativeCoin.blockExplorerUrl.replace(
                              "TX_HASH",
                              tx?.transactionHash || "",
                          ),
                urlLabel: tx?.transactionHash,
            });
        } catch (e: unknown) {
            let err = e as Error;
            if (isVisible) {
                errorLabel = err.message;
                status = "error";
            } else {
                notification({
                    type: "error",
                    text: `${err.message}`,
                });
            }
        }
        disabeled = false;
        //60000
    };
    let content: HTMLElement;
    const handleClickOutside = (e: MouseEvent) => {
        if (!e.target) return;
        let t = e.target as Node;
        if (content.contains(t) || t === content) {
            return;
        }
        isVisible = false;
    };
    let transferAmount = Decimal.zero(0);
    let available = Decimal.zero(0);
    $: if (prevVisible != isVisible && coin) {
        available =
            direction === "deposit" ? coin.nativeAmount : coin.onChainAmount;
        transferAmount = Decimal.zero(coin.coinDecimals);
        prevVisible = isVisible;
    }
</script>

{#if isVisible}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="ibc-modal" on:click={handleClickOutside} use:trapFocus>
        <div class="content" bind:this={content}>
            <h1>{caplz(direction)} {coin.coinDenom}</h1>
            <div class="wpr">
                {#await $user?.offlineSigner.getAccounts() || [] then [account]}
                    {#if direction === "withdraw"}
                        <InputAddress
                            address={account.address}
                            icon={nativeCoin.icon}
                            name={nativeCoin.chainName}
                            label={`From ${nativeCoin.chainName}`}
                        />
                        <div class="dir">
                            <i class="ri-arrow-right-line"></i>
                        </div>
                        <InputAddress
                            address={toPrefix(
                                account.address,
                                coin.addressPrefix,
                            )}
                            icon={coin.icon}
                            name={coin.chainName}
                            label={`To ${coin.chainName}`}
                        />
                    {:else}
                        <InputAddress
                            address={toPrefix(
                                account.address,
                                coin.addressPrefix,
                            )}
                            icon={coin.icon}
                            name={coin.chainName}
                            label={`From ${coin.chainName}`}
                        />
                        <div class="dir">
                            <i class="ri-arrow-right-line"></i>
                        </div>
                        <InputAddress
                            address={account.address}
                            icon={nativeCoin.icon}
                            name={nativeCoin.chainName}
                            label={`To ${nativeCoin.chainName}`}
                        />
                    {/if}
                {/await}
            </div>
            <button
                class="button-3-2 close"
                on:click={() => (isVisible = false)}
            >
                <i class="ri-close-line"></i>
            </button>
            <AmountInput
                bind:coinDenom={coin.coinDenom}
                useNativeAmount={direction !== "withdraw"}
                label="Select Amount"
                bind:value={transferAmount}
            ></AmountInput>
            <div class="info {status}">
                {#if status === ""}
                    <i class="ri-time-line"></i>
                    <p>Estimated time: <span>20 seconds</span></p>
                {:else}
                    <i class="ri-error-warning-line"></i>
                    <p>{errorLabel}</p>
                {/if}
            </div>
            <button
                class="button-1 action"
                disabled={transferAmount.equals(
                    Decimal.zero(coin.coinDecimals),
                ) ||
                    transferAmount.isGreaterThan(available) ||
                    disabeled}
                on:click={transfer}
            >
                {#if disabeled}
                    <i class="rotate ri-loader-4-fill"></i>
                {:else}
                    {caplz(direction)}
                {/if}
            </button>
            <button class="button-3 cancel" on:click={() => (isVisible = false)}
                >Cancel</button
            >
        </div>
    </div>
{/if}

<style lang="scss">
    @use "../media.scss";
    .ibc-modal {
        background-color: var(--black-a4);
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

        @keyframes rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
        .rotate {
            animation: rotate 1000ms linear infinite;
            display: block;
        }

        .info {
            background-color: var(--gray-2);
            width: 100%;
            display: flex;
            border-radius: 3px;
            color: var(--gray-9);
            padding: 0.5rem;
            gap: 0.5rem;
            &.error {
                color: var(--red-11);
                i {
                    color: var(--red-11);
                }
            }
            p {
                span {
                    font-weight: bold;
                    color: var(--gray-10);
                }
            }
        }

        .close {
            position: absolute;
            aspect-ratio: 1;
            right: 1rem;
            top: 1rem;
            border-radius: 3px;
        }

        .content {
            width: 50%;
            height: 80%;
            padding: 5%;
            background-color: var(--gray-1);
            border-radius: 5px;
            border: 1px solid var(--gray-3);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            position: relative;
            @include media.for-size(tablet) {
                width: 80%;
            }

            @include media.for-size(phone) {
                width: 100%;
                height: 100%;
                .wpr {
                    flex-direction: column;
                    .dir {
                        width: 50px;
                        align-self: center;
                        transform: rotate(90deg);
                    }
                }
            }
            h1 {
                font-size: 2rem;
                align-self: flex-start;
                font-weight: 900;
                color: var(--gray-12);
                margin-bottom: 1rem;
            }
            .wpr {
                display: flex;
                gap: 1rem;
                width: 100%;
                .dir {
                    aspect-ratio: 1;
                    background-color: var(--gray-2);
                    color: var(--gray-11);
                    border: 1px solid transparent;
                    padding: 0 1em;
                    border-radius: 5px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            }

            .action {
                width: 100%;
                height: 3rem;
            }
            .cancel {
                height: 3rem;
                width: 100%;
            }
        }
    }
</style>

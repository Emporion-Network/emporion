<script lang="ts">
    import { prices, type CoinData } from "../stores/coins";
    import { logIn, logOut, user } from "../stores/user";
    import { Decimal } from "@cosmjs/math";
    import { clickOutside } from "./directives";
    import IbcModal from "./IbcModal.svelte";
    let isOpen = false;
    let showModal = false;
    let direction: "deposit" | "withdraw" = "deposit";
    const { VITE_NATIVE_COIN: NATIVE_COIN } = import.meta.env;

    const copy = (str: string) => (e: MouseEvent) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        navigator.clipboard.writeText(str);
    };
    const open = () => {
        isOpen = true;
    };
    const close = () => {
        isOpen = false;
    };
    let nativeCoin: string;
    let coin: string;
    const deposit = (newNativeCoin: CoinData, newCoin: CoinData) => () => {
        nativeCoin = newNativeCoin.coinDenom;
        coin = newCoin.coinDenom;
        showModal = true;
        isOpen = false;
        direction = "deposit";
    };
    const withdraw = (newNativeCoin: CoinData, newCoin: CoinData) => () => {
        nativeCoin = newNativeCoin.coinDenom;
        coin = newCoin.coinDenom;
        showModal = true;
        isOpen = false;
        direction = "withdraw";
    };
</script>

{#if $user?.address && $prices[NATIVE_COIN]?.onChainAmount}
    {@const nativeCoin = $prices[NATIVE_COIN]}
    <div class="wallet input">
        <button class="header" on:click={open}>
            <img src={nativeCoin.icon} alt={nativeCoin.coinDenom} />
            <div class="address">
                <span
                    >{$user.address.slice(0, 11)}...{$user.address.slice(
                        -4,
                    )}</span
                >
                <button on:click={copy($user.address)}
                    ><i class="ri-file-copy-line"></i></button
                >
            </div>
            <div class="amount">
                <span
                    >{nativeCoin.onChainAmount.toString()}
                    {nativeCoin.coinDenom}</span
                >
                <span class="price">
                    {nativeCoin.price.toString()} USD
                    <i
                        class={nativeCoin.change24h > 0
                            ? "up ri-arrow-right-up-line"
                            : "down ri-arrow-right-down-line"}
                    ></i>
                </span>
            </div>
        </button>
        {#if isOpen}
            <div class="fold" use:clickOutside={close}>
                <div class="assets">
                    {#each Object.values($prices) as coin}
                        {#if coin !== nativeCoin}
                            <div class="asset">
                                <img src={coin.icon} alt={coin.coinDenom} />
                                <div class="amount">
                                    <span
                                        >{coin.onChainAmount.toString()}
                                        {coin.coinDenom}</span
                                    >
                                    <span class="price">
                                        {coin.price.toString()} USD
                                        <i
                                            class={coin.change24h > 0
                                                ? "up ri-arrow-right-up-line"
                                                : "down ri-arrow-right-down-line"}
                                        ></i>
                                    </span>
                                </div>
                                {#if coin.onChainDenom !== coin.coinMinimalDenom}
                                    <button
                                        class="button-1-2 buttons"
                                        on:click={deposit(nativeCoin, coin)}
                                        disabled={coin.nativeAmount.equals(
                                            Decimal.zero(coin.coinDecimals),
                                        )}
                                    >
                                        <span class="from">Deposit</span>
                                    </button>
                                    <button
                                        class="button-1-2 buttons"
                                        on:click={withdraw(nativeCoin, coin)}
                                        disabled={coin.onChainAmount.equals(
                                            Decimal.zero(coin.coinDecimals),
                                        )}
                                    >
                                        <span class="from">Withdraw</span>
                                    </button>
                                {/if}
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    </div>
    <button class="button-2 logout" on:click={logOut}> 
        <i class="ri-logout-box-r-line"></i>
    </button>
{:else}
    <button class="button-1 login" on:click={logIn}> Connect wallet </button>
{/if}

<IbcModal
    bind:isVisible={showModal}
    bind:nativeCoinDenom={nativeCoin}
    bind:coinDenom={coin}
    {direction}
></IbcModal>

<style lang="scss">
    @use "../media.scss";

    .wallet {
        display: flex;
        gap: 0.5rem;
        position: relative;
        width: max-content;
        z-index: 2;
        border-radius: 5px;
        margin-right: 0.5rem;
        @include media.for-size(phone) {
            min-width: unset;
            width: 100%;
        }
        img {
            width: 30px;
            height: 30px;
        }
        .fold {
            background-color: var(--gray-3);
            color: var(--gray-12);
            border-radius: 5px;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            min-width: max-content;
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            overflow: hidden;
            box-shadow: 1px -2px 12px var(--black-a4);
            @include media.for-size(phone) {
                position: fixed;
                width: 100vw;
                min-width: none;
                top: 8rem;
                right: 0;
                height: calc(100vh - 8rem);
                border-radius: 0;
                border: none;
                .assets {
                    max-height: 100vh;
                }
                .asset {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    grid-template-rows: 1fr 1fr;
                    .amount {
                        grid-column-start: 2;
                        grid-column-end: 5;
                        width: 100%;
                        align-items: flex-end;
                    }
                }
                .buttons {
                    grid-column-start: span 2;
                }
            }
        }
        .assets {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-height: 40vh;
            overflow: auto;
            &::-webkit-scrollbar {
                display: none;
            }
        }
        .header {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 0.5rem;
            cursor: pointer;
            background-color: var(--gray-1);
            border: 2px solid var(--gray-5);
            border-radius: 3px;
            color: var(--gray-12);
            height: 3.6rem;
            &:hover {
                border: 2px solid var(--gray-7);
                background-color: var(--gray-2);
            }

            @include media.for-size(phone) {
                flex: 1;
                .address {
                    width: 100%;
                    span {
                        flex: 1;
                    }
                }
                .amount {
                    display: none;
                }
            }

            .address {
                display: flex;
                margin-right: auto;
                gap: 3px;
                margin-right: 1rem;
                margin-left: 3px;
                align-items: center;
                flex: 1;
                button {
                    border: none;
                    padding: 3px;
                    background-color: transparent;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: inherit;
                }
            }
            .amount {
                align-items: flex-end;
            }
        }
        .asset {
            display: flex;
            gap: 1rem;
            align-items: center;
            padding: 1rem;
            cursor: pointer;
            &:hover {
                background-color: var(--gray-4);
            }
            .buttons {
                font-size: small;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .amount {
                margin-right: auto;
            }
        }
        .amount {
            display: flex;
            flex-direction: column;
            .price {
                font-size: 0.6rem;
                width: max-content;
                padding: 1px 5px;
                border-radius: 2px;
                .up {
                    color: #3dd68c;
                }
                .down {
                    color: #ec5d5e;
                }
            }
        }
    }
    .login, .logout {
        height: 3.6rem;
        background-color: var(--gray-1);
        border: 2px solid var(--gray-5);
        border-radius: 3px;
        color: var(--gray-12);
        &:hover {
            border: 2px solid var(--gray-7);
            background-color: var(--gray-2);
        }
    }
</style>

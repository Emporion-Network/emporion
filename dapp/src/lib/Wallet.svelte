<script lang="ts">
    import { prices, type CoinData } from "../stores/coins";
    import { logIn, user } from "../stores/user";
    import { Decimal } from "@cosmjs/math";
    import { clickOutside } from "../directives";
    import IbcModal from "./IbcModal.svelte";
    import { toPrefix } from "../utils";
    import { cart, openCart } from "../stores/cart";
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

    const sellectAsset = (coin: CoinData) => () => {
        if ($user) {
            $user.selectedCoin = coin.coinDenom;
        }
    };
</script>

{#if $user?.address && $prices[NATIVE_COIN]?.onChainAmount}
    {@const nativeCoin = $prices[NATIVE_COIN]}
    {@const selectedCoin = $prices[$user.selectedCoin]}
    {@const addr = toPrefix($user.address, selectedCoin.addressPrefix)}
    <div class="wallet input">
        <div 
        class="header input" 
        tabindex="0" role="button" 
        on:keydown={(e)=>['Enter', ' '].includes(e.key) ? open() : undefined}
        on:click={open}>
            <button class="to-profile">
                <i class="ri-user-fill"></i>
            </button>
            <div class="address">
                <span>{addr.slice(0, 11)}...{addr.slice(-4)}</span>
                <button on:click={copy(addr)}
                    ><i class="ri-file-copy-line"></i></button
                >
            </div>
            <div class="amount">
                <span
                    >{selectedCoin.onChainAmount.toString()}
                    {selectedCoin.coinDenom}</span
                >
                <span class="price">
                    {selectedCoin.price.toString()} USD
                    <i
                        class={selectedCoin.change24h > 0
                            ? "up ri-arrow-right-up-line"
                            : "down ri-arrow-right-down-line"}
                    ></i>
                </span>
            </div>
        </div>
        {#if isOpen}
            <div class="fold" use:clickOutside={close}>
                <div class="assets">
                    {#each Object.values($prices) as coin}
                        {#if coin !== selectedCoin}
                            <div
                                class="asset"
                                on:click={sellectAsset(coin)}
                                role="button"
                                tabindex="0"
                                on:keydown={() => {}}
                            >
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
    <button class="button-1 header-button" on:click={openCart}>
        {#if $cart.length > 0}
            <span>{$cart.length}</span>
        {/if}
        <i class="ri-shopping-cart-2-line"></i>
    </button>
{:else}
    <button class="button-1 header-button" on:click={logIn}>
        Connect wallet
    </button>
    <button class="button-1 header-button" on:click={openCart}>
        {#if $cart.length > 0}
            <span>{$cart.length}</span>
        {/if}
        <i class="ri-shopping-cart-2-line"></i>
    </button>
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
        @include media.for-size(phone) {
            min-width: unset;
            width: 100%;
        }
        .to-profile{
            background-color: transparent;
            aspect-ratio: 1;
            height: 100%;
            color: var(--gray-12);
            border: 1px solid transparent;
            cursor: pointer;
            border-radius: 3px;
            &:hover{
                background-color: var(--indigo-a3);
                border: 1px solid var(--indigo-6);
                color: var(--indigo-12);
            }
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
    .header-button {
        height: 3.6rem;
        background-color: var(--gray-1);
        border: 2px solid var(--gray-5);
        border-radius: 3px;
        color: var(--gray-12);
        position: relative;
        span{
            display: block;
            width: 16px;
            height: 16px;
            background-color: var(--red-10);
            color: var(--white-12);
            position: absolute;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 20px;
            font-weight: 900;
            font-size: 0.6rem;
            top:4px;
            right: 4px;
        }
        &:hover {
            border: 2px solid var(--gray-7);
            background-color: var(--gray-2);
        }
    }
</style>

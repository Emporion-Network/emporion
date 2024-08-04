import { writable } from "svelte/store";
import type { Window as KeplrWindow, Keplr } from "@keplr-wallet/types";
import { CosmWasmClient, SigningCosmWasmClient, } from "@cosmjs/cosmwasm-stargate";
import { StargateClient } from "@cosmjs/stargate";
import { GasPrice } from "@cosmjs/stargate";
const {
    VITE_NATIVE_COIN: NATIVE_COIN,
} = import.meta.env;

import { EmporionClient } from "../../../client-ts/Emporion.client"
import { getNames } from "../lib/utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Window extends KeplrWindow { }
}

type OfflineSigner = ReturnType<Keplr['getOfflineSigner']>

const user = writable<{
    offlineSigner: OfflineSigner,
    emporionClient: EmporionClient,
    cosmWasmClient: CosmWasmClient,
    selectedCoin: string,
    address: string,
    names: string[]
} | null>(null);

const autoLogIn = {
    set(v: boolean) {
        localStorage.setItem("auto-login", `${v}`);
    },
    get() {
        return JSON.parse(localStorage.getItem("auto-login") || "false");
    }
};

const setUser = async () => {
    try {
        if (!window.keplr) return;
        const {
            VITE_ENDPOINT_RPC: ENDPOINT_RPC,
            VITE_STORE_ADDRESS: STORE_ADDRESS,
        } = import.meta.env;

        const qc = await StargateClient.connect(ENDPOINT_RPC);

        const chainId = await qc.getChainId()

        await window.keplr.enable(chainId);
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        const cosmWasmClient = await SigningCosmWasmClient.connectWithSigner(ENDPOINT_RPC, offlineSigner, {
            gasPrice: GasPrice.fromString("0.02untrn"),
        });
        const address = (await offlineSigner.getAccounts())[0].address;
        const emporionClient = new EmporionClient(cosmWasmClient, address, STORE_ADDRESS);
        
        user.set({
            offlineSigner,
            emporionClient,
            cosmWasmClient,
            selectedCoin: NATIVE_COIN,
            address,
            names:await getNames(address),
        })
        autoLogIn.set(true);
    } catch (e) {
        autoLogIn.set(false)
    }
}

const logOut = async () => {
    if (!window.keplr) return;
    const {
        VITE_ENDPOINT_RPC: ENDPOINT_RPC,
    } = import.meta.env;

    const qc = await StargateClient.connect(ENDPOINT_RPC);
    const chainId = await qc.getChainId();
    user.set(null);
    window.keplr.disable(chainId);
    autoLogIn.set(false);
}

window.onload = () => {
    if (window.keplr && autoLogIn.get()) {
        setUser()
    }
}

const logIn = () => {
    setUser();
}

window.addEventListener("keplr_keystorechange", () => {
    setUser()
})


export { user, logOut, logIn };
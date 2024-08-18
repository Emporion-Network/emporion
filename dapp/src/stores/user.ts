import { writable } from "svelte/store";
import type { Window as KeplrWindow, Keplr } from "@keplr-wallet/types";
import { CosmWasmClient, SigningCosmWasmClient, } from "@cosmjs/cosmwasm-stargate";
import { StargateClient } from "@cosmjs/stargate";
import { GasPrice } from "@cosmjs/stargate";

const {
    VITE_NATIVE_COIN: NATIVE_COIN,
    VITE_ENDPOINT_BACK_END_API: ENDPOINT_BACK_END_API,
    VITE_ENDPOINT_RPC: ENDPOINT_RPC,
    VITE_STORE_ADDRESS: STORE_ADDRESS,
} = import.meta.env;

import { EmporionClient } from "../../../client-ts/Emporion.client"
import { Api } from "../api";

import { getNames, signMessage } from "../utils";
import { notification } from "../lib/Notifications.svelte";
import { cart } from "./cart";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Window extends KeplrWindow { }
}

type OfflineSigner = ReturnType<Keplr['getOfflineSigner']>

const user = writable<{
    offlineSigner: OfflineSigner,
    emporionClient: EmporionClient<SigningCosmWasmClient>,
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


const jwt = {
    set(v: string) {
        localStorage.setItem("item", v ? `${v}` : '');
    },
    get() {
        return localStorage.getItem("item") || undefined;
    },
    decoded() {
        let token = this.get();
        if (!token) return
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload) as {
            address: string,
            exp: number
        };
    },
    isExp() {
        return (this.decoded()?.exp || 0) < Date.now() / 1000
    },
    clear() {
        localStorage.removeItem('item');
    }
};

Api.notify = (err, log) => {
    if(err){
        notification({
            type: 'error',
            text: err
        })
    }
    if(log){
        notification({
            type: 'success',
            text: log
        })
    }
}

const api = new Api(ENDPOINT_BACK_END_API, '');



const setUser = async () => {
    try {
        if (!window.keplr) return;
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
            names: await getNames(address),
        })
        autoLogIn.set(true);
        
        if (!jwt.isExp() && jwt.decoded()?.address == address) {
            api.setToken(jwt.get()!);
            return;
        }
        cart.set([]);

        const { nonce } = await api.post<{ address: string }, { nonce: string }>(`${ENDPOINT_BACK_END_API}/nonce`, { address })
        let signature = await signMessage(nonce);

        const { token } = await api.post<any, { token: string }>(`${ENDPOINT_BACK_END_API}/check-nonce`, {
            ...signature,
            nonce,
            address,
        })
        jwt.set(token)
        api.setToken(token);


    } catch (e) {
        autoLogIn.set(false)
        jwt.clear();
        console.log(e);
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
    jwt.clear();
    api.setToken('');
    window.keplr.disable(chainId);
    autoLogIn.set(false);
}


if (window.keplr && autoLogIn.get()) {
    setUser()
}


const logIn = () => {
    if (!window.keplr) {
        notification({
            type: "error",
            text: "Please install Keplr",
            urlLabel: "Get Keplr",
            url: "https://www.keplr.app/"
        })
        return;
    }
    setUser();
}

window.addEventListener("keplr_keystorechange", () => {
    setUser()
})




export { user, logOut, logIn, jwt, api };
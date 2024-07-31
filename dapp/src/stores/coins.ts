import { writable } from "svelte/store";
import { StargateClient, setupIbcExtension, QueryClient, type IbcExtension } from "@cosmjs/stargate";
import { Decimal } from "@cosmjs/math";
import { rotateObj, toPrefix } from "../lib/utils";
import { user } from "./user";
import { notification } from "../lib/Notifications.svelte";

const {
    VITE_NATIVE_COIN: NATIVE_COIN,
} = import.meta.env;


// const { COIN_DATA } = await import(`../COIN_DATA.${import.meta.env.MODE}.ts`) as { COIN_DATA: CoinMap };
//@ts-ignore
const { COIN_DATA } = await import("../COIN_DATA.production.ts") as { COIN_DATA: CoinMap };

export type CoinData = {
    icon: string,
    coinGeckoId: string,
    coinDenom: string,
    coinMinimalDenom: string,
    onChainDenom: string,
    coinDecimals: number,
    rpc: string,
    queryClient: StargateClient & IbcExtension,
    ibcTxs: { sequence: number, direction: 'withdraw' | 'deposit' }[],
    onChainAmount: Decimal,
    nativeAmount: Decimal,
    price: Decimal,
    change24h: number,
    addressPrefix: string,
    chainName: string,
    withdrawChanel: string,
    depositChanel: string,
    gasPrice: string,
}

export type CoinMap = Record<string, CoinData>;

const prices = writable<CoinMap>(COIN_DATA);
let timeout: ReturnType<typeof setTimeout>;

export const addIbcTx = (denom:string, tx:{ sequence: number, direction: 'withdraw' | 'deposit' })=>{
    COIN_DATA[denom].ibcTxs.push(tx)
}


export const clean = ()=>{
    clearTimeout(timeout);
}

export const watchPrices = async () => {
    await Promise.all(Object.keys(COIN_DATA).map(async (k) => {
        let client = await StargateClient.connect(COIN_DATA[k].rpc);
        //@ts-ignore
        let x = setupIbcExtension(client.queryClient);
        //@ts-ignore
        client.ibc = x.ibc;
        //@ts-ignore
        COIN_DATA[k].queryClient = client;
        COIN_DATA[k].price = Decimal.zero(2);
        COIN_DATA[k].change24h = 0
        COIN_DATA[k].ibcTxs = [];
    }));

    let ids = Object.values(COIN_DATA).map(e => e.coinGeckoId).join(',');

    let userAddress = '';
    let prevTime = Date.now();
    user.subscribe(async (newU) => {
        if (!newU) {
            userAddress = '';
            return;
        };
        const address = (await newU.offlineSigner.getAccounts())[0].address;
        userAddress = address;

        if (timeout) {
            clearTimeout(timeout)
        }
        updatePrices();
    })

    const updatePrices = async () => {
        prevTime = Date.now()
        try {
            const resp = await (await fetch(`/price/api/v3/simple/price?ids=${ids}&vs_currencies=usd&precision=3&include_24hr_change=true`)).json();
            const REF = rotateObj(COIN_DATA, 'coinGeckoId');
            Object.keys(resp).forEach((k) => {
                REF[k].price = Decimal.fromUserInput(resp[k].usd.toFixed(2), 2)
                REF[k].change24h = resp[k].usd_24h_change
            });
        } catch {
            Object.keys(COIN_DATA).forEach((k) => {
                COIN_DATA[k].price = COIN_DATA[k].price ?? Decimal.zero(2);
            });
        }

        try {
            if (userAddress === '') return;
            const depositing = Object.values(COIN_DATA)
            .map(c => c.ibcTxs.filter(e => e.direction === 'deposit').map(e => ({ sequence: e.sequence, coin: c }))).flat();
            await Promise.all(Object.values(COIN_DATA).map(async c => {
                let offchainAddress = toPrefix(userAddress, c.addressPrefix);
                if (c.coinDenom === NATIVE_COIN) {
                    let onChainBalance =await COIN_DATA[NATIVE_COIN].queryClient.getBalance(userAddress, c.onChainDenom);
                    c.onChainAmount = Decimal.fromAtomics(onChainBalance.amount, c.coinDecimals);
                    c.nativeAmount = Decimal.fromAtomics(onChainBalance.amount, c.coinDecimals);
                    depositing.forEach(async e => {
                        let r = await c.queryClient.ibc.channel.packetReceipt('transfer', e.coin.withdrawChanel, e.sequence);
                        if (r.received) {
                            notification({
                                type:"success",
                                text:`Your ${e.coin.coinDenom} are available`,
                            })
                            e.coin.ibcTxs = e.coin.ibcTxs.filter(t => t.sequence != e.sequence);
                        }
                    })
                } else {
                    let offchainBalance = await c.queryClient.getBalance(offchainAddress, c.coinMinimalDenom);
                    let onChainBalance = await COIN_DATA[NATIVE_COIN].queryClient.getBalance(userAddress, c.onChainDenom);
                    c.onChainAmount = Decimal.fromAtomics(onChainBalance.amount, c.coinDecimals);
                    c.nativeAmount = Decimal.fromAtomics(offchainBalance.amount, c.coinDecimals);
                    c.ibcTxs.filter(t => t.direction === 'withdraw').forEach(async t => {
                        let r = await c.queryClient.ibc.channel.packetReceipt('transfer', c.depositChanel, t.sequence);
                        if (r.received) {
                            console.log('withrew!')
                            notification({
                                type:"success",
                                text:`Your ${c.coinDenom} have been withdrawn successfully`,
                            })
                            c.ibcTxs = c.ibcTxs.filter(tp => tp.sequence != t.sequence);
                        }
                    })
                }

            }))
        } catch {
        }

        prices.update(()=>({...COIN_DATA}));

        timeout = setTimeout(updatePrices, 10000);
    }

};




export { prices }
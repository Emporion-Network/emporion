import { toBech32, fromBech32 } from "@cosmjs/encoding"
import { addIbcTx, type CoinData } from "./stores/coins";
import { SigningStargateClient } from "@cosmjs/stargate";
import { MsgTransfer } from "cosmjs-types/ibc/applications/transfer/v1/tx"
import { Decimal } from "@cosmjs/math";
import { GasPrice } from "@cosmjs/stargate";
import { CosmWasmClient, type ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import type { ProductMetaData } from "../../shared-types";
import stringify from 'json-stable-stringify';
import { sha256 } from '@cosmjs/crypto';
import type { AssetInfoBaseForAddr, Product } from "../../client-ts/Emporion.types";
import type { Duration, Expiration } from "../../client-ts/Emporion.client";

export const caplz = (str: string) => {
    return `${str[0].toUpperCase()}${str.slice(1)}`;
};

export const scrollTo = async (
    e: HTMLElement,
    d: number,
    dir: "top" | "left" = "top",
    epsilon = 0,
) => {
    return new Promise((resolve) => {
        let x = `scroll${caplz(dir)}` as "scrollTop";
        let p = e.parentElement as HTMLElement;
        let sp = p[x] as number;
        let ed =
            e.getBoundingClientRect()[dir] - p.getBoundingClientRect()[dir];
        ed += ed > 0 ? epsilon : -epsilon;
        let st: number;
        const animate = (s: number) => {
            if (!st) st = s;
            let t = s - st;
            let pct = Math.min(t / d, 1);
            p[x] = sp + ed * pct;
            if (pct >= 1) {
                resolve(true);
                return;
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    });
};

export const together = async (...p: Promise<any>[]) => {
    await Promise.all(p)
}

export function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function easeOutSine(x: number): number {
    return Math.sin((x * Math.PI) / 2);
}

export function easeOutExpo(x: number): number {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}
export function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export const aminateProp = (prop: string, start: number, end: number, unit = '', easingFn: (n:
    number) => number = easeInOutCubic) => async (el: HTMLElement, d: number) => {
        return new Promise((resolve) => {
            let sp = start;
            let ed = end - start;
            let st: number;
            const animate = (s: number) => {
                if (!st) st = s;
                let t = s - st;
                let pct = easingFn(Math.min(t / d, 1));
                el.style.setProperty(prop, `${sp + ed * pct}${unit}`);
                if (pct >= 1) {
                    resolve(true);
                    return;
                }
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        })
    }

export const fadeIn = aminateProp('--opacity', 0, 1);
export const fadeOut = aminateProp('--opacity', 1, 0);


export const wait = (ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

export const inseries = async (s: () => Promise<any>) => {
    await s();
}

export const onevent = async (el: HTMLElement, evt: string) => {
    return new Promise(resolve => {
        let handle = () => {
            el.removeEventListener(evt, handle);
            resolve(true);
        }
        el.addEventListener(evt, handle);
    })
}

export const rotateObj = <T>(obj: Record<string, T>, key: keyof T) => {
    return Object.keys(obj).reduce((acc, k) => {
        //@ts-ignore
        acc[obj[k][key]] = obj[k];
        return acc;
    }, {} as Record<string, T>)
}

export const toPrefix = (addr: string, prefix: string) => {
    let origin = fromBech32(addr);
    return toBech32(prefix, origin.data);
}

export const ibcTransfer = (direction: "deposit" | "withdraw") => async (nativeCoin: CoinData, coin: CoinData, amount: Decimal) => {
    if (!window.keplr) return;
    const exp = BigInt(Date.now() + 20 * 60 * 1000) * 1000000n
    if (direction === 'deposit') {
        let fromChain = await coin.queryClient.getChainId();
        let toChain = await nativeCoin.queryClient.getChainId();
        let signer = await window.keplr.getOfflineSigner(fromChain);
        let fromAddress = (await window.keplr.getKey(fromChain)).bech32Address;
        let toAddress = (await window.keplr.getKey(toChain)).bech32Address
        let client = (await SigningStargateClient.connectWithSigner(coin.rpc, signer, {
            gasPrice: GasPrice.fromString(coin.gasPrice)
        }));



        const transferMsg = {
            typeUrl: MsgTransfer.typeUrl,
            value: MsgTransfer.fromPartial({
                sender: fromAddress,
                receiver: toAddress,
                sourceChannel: coin.depositChanel,
                sourcePort: 'transfer',
                timeoutTimestamp: exp,
                token: {
                    denom: coin.coinMinimalDenom,
                    amount: amount.atomics
                },
            })

        }
        let tx = await client.signAndBroadcast(fromAddress, [transferMsg], "auto");
        let msg = tx.events.map(e => e.attributes).flat()
            .find(e => e.key === "packet_sequence");
        if (!msg) return tx;
        let sequence = Number(msg.value)
        addIbcTx(coin.coinDenom, { sequence, direction });
        return tx;
    }

    let fromChain = await nativeCoin.queryClient.getChainId();
    let toChain = await coin.queryClient.getChainId();
    let signer = await window.keplr.getOfflineSigner(fromChain);
    let fromAddress = (await window.keplr.getKey(fromChain)).bech32Address;
    let toAddress = (await window.keplr.getKey(toChain)).bech32Address
    let client = (await SigningStargateClient.connectWithSigner(nativeCoin.rpc, signer, {
        gasPrice: GasPrice.fromString(nativeCoin.gasPrice)
    }));
    const transferMsg = {
        typeUrl: MsgTransfer.typeUrl,
        value: MsgTransfer.fromPartial({
            sender: fromAddress,
            receiver: toAddress,
            sourceChannel: coin.withdrawChanel,
            sourcePort: 'transfer',
            timeoutTimestamp: exp,
            token: {
                denom: coin.onChainDenom,
                amount: amount.atomics
            },
        })

    }
    let tx = await client.signAndBroadcast(fromAddress, [transferMsg], "auto");
    let msg = tx.events.map(e => e.attributes).flat()
        .find(e => e.key === "packet_sequence");
    if (!msg) return tx;
    let sequence = Number(msg.value)
    addIbcTx(coin.coinDenom, { sequence, direction });

    return tx
}


export const multiply_ratio = (a: Decimal, [b, c]: [number, number]) => {
    let ba = BigInt(a.atomics);
    let newA = (ba * BigInt(b) / BigInt(c)).toString();
    return Decimal.fromAtomics(newA, a.fractionalDigits)
}


export const hash = (str: string) => {
    const buf = new TextEncoder().encode(str);
    const h = sha256(buf)
    const hex = Array.from(h).map((b) => b.toString(16).padStart(2, "0")).join("");
    return hex.toLocaleLowerCase();
}


export const getMetaHash = (meta: ProductMetaData) => {
    const p: Partial<ProductMetaData> = structuredClone(meta);
    delete p.id;
    const h = stringify(p)
    return hash(h)
}




export const id = () => {
    const dateString = Date.now().toString(36);
    const randomness = Math.random().toString(36).substring(2);
    return dateString + randomness;
};

const sgzClient = CosmWasmClient.connect("https://stargaze-rpc.publicnode.com:443");

export const getNames = async (address: string) => {
    const client = await sgzClient;
    try {
        let res = await client.queryContractSmart("stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr", {
            name: { address: toPrefix(address, "stars") },
        }) as string;
        return [res];
    } catch (e) {
    }
    return []
}

export const intersect = <T>(a: T[], b: T[]) => {
    return a.filter(e => b.indexOf(e) !== -1)
}


export class Map2<K1, K2, T> {
    private map = new Map<K1, Map<K2, T>>();

    get([k1, k2]: [k1: K1, k2: K2]): T | undefined {
        return this.map.get(k1)?.get(k2);
    }

    set([k1, k2]: [k1: K1, k2: K2], v: T) {
        if (!this.map.has(k1)) {
            this.map.set(k1, new Map());
        }
        this.map.get(k1)?.set(k2, v);
    }

    has([k1, k2]: [k1: K1, k2: K2]) {
        return this.get([k1, k2]) !== undefined;
    }

    keys(): [K1, K2][] {
        return Array.from(this.map.keys())
            .map((k1) => {
                return Array.from(this.map.get(k1)?.keys() || []).map(
                    (k2) => [k1, k2] as [K1, K2],
                );
            })
            .flat(1);
    }
}


export class LMap<K, V> {
    private map = new Map<string, V>();
    set(k: K, v: V) {
        this.map.set(JSON.stringify(k), v);
    }
    get(k: K) {
        return this.map.get(JSON.stringify(k))
    }

    keys() {
        return Array.from(this.map.keys()).map(k => JSON.parse(k) as K)
    }
    has(k: K) {
        return this.map.has(JSON.stringify(k))
    }

    values() {
        return this.map.values()
    }

    forEach(fn: (v: V, k: K) => void) {
        this.map.forEach((v, k) => {
            fn(v, JSON.parse(k))
        })
    };

    entries() {
        return Array.from(this.map.entries()).map(([k, v]) => {
            return [JSON.parse(k), v]
        }).values()
    }
}

export const eq = <T, K>(a: T, b: K) => {
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!eq(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null && Object.prototype.toString.call(a) === Object.prototype.toString.call(b)
        && Object.prototype.toString.call(a) === '[object Object]') {
        let ks = Object.keys(a);
        if (ks.length !== Object.keys(b).length) {
            for (const key of ks) {
                if (!('key' in b)) return false;
                //@ts-ignore
                if (!eq(a[key], b[key])) return false;
            }
            return true;
        }
    }
    //@ts-ignore
    return a === b
}

export const signMessage = async (nonce: string) => {
    if (!window.keplr) return;
    const key = await window.keplr.getKey('cosmoshub-4')
    const signature = await window.keplr.signArbitrary('cosmoshub-4', key.bech32Address, nonce);
    return signature;
}



export const extractAttr = (attr: string, resp: ExecuteResult) => {
    const attrs = resp.events.filter(e => e.type == 'wasm').map(e => e.attributes).flat()
    return attrs.find(a => a.key === attr)?.value
}


export const swap = <T>(arr: T[], idxA: number, idxB: number) => {
    [arr[idxA], arr[idxB]] = [arr[idxB], arr[idxA]];
};

export const getOnChainDenom = (info: AssetInfoBaseForAddr) => {
    if ("cw20" in info) {
        return info.cw20;
    }
    return info.native;
};
export const getPrices = (product: Product, record: Record<string, CoinData>) => {
    return product.price.map((e) => {
        let denom = getOnChainDenom(e.info);
        return {
            denom: record[denom].coinDenom,
            amount: Decimal.fromAtomics(e.amount, record[denom].coinDecimals),
        };
    });
};

export const getExpirationDate = (expiration: Expiration) => {
    if ('at_time' in expiration) {
        return new Date(Number(expiration.at_time.slice(0, 13)))
    }
    return new Date()
}

export const DAY = 86400;


export const s = (n: number) => n > 1 ? "s" : "";

export const msToStr = (t: number) => {
    const days = t / DAY;
    if (days % 7 == 0) {
        const weeks = days / 7
        return `${weeks} week${s(weeks)}`
    }
    if (days % 30 == 0) {
        const monts = days / 30
        return `${monts} month${s(monts)}`
    }
    return `${days} day${s(days)}`
}

export const getDeliveryDuration = (duration: Duration) => {
    if ('time' in duration) {
        return msToStr(duration.time)
    }
    return "";
}


export const dateToString = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        month: 'short',
        day: 'numeric',
    })
}

export const getDeliveryFormatedDate = (duration: Duration) => {
    if ('time' in duration) {
        const date = new Date()
        date.setDate(date.getDate() + Math.floor(duration.time / DAY))
        return dateToString(date)
    }
}

export const trimStrings = <T>(o: T): T => {
    if (Array.isArray(o)) {
        return o.map(i => trimStrings(i)) as T;
    }
    if (typeof o == 'object' && o && Object.prototype.toString.call(o) === '[object Object]') {
        Object.keys(o).forEach((k) => {
            let key = k as keyof typeof o;
            o[key] = trimStrings(o[key])
        })
        return o;
    }
    if (typeof o === 'string') {
        return o.trim() as T;
    }
    return o;
}

export const ENV = {
    ...import.meta.env,
    ENDPOINT_RPC: import.meta.env.VITE_ENDPOINT_RPC,
    ENDPOINT_BACK_END_API: import.meta.env.VITE_ENDPOINT_BACK_END_API,
    ENPOINT_API: import.meta.env.VITE_ENPOINT_API,
    STORE_ADDRESS: import.meta.env.VITE_STORE_ADDRESS,
    NATIVE_COIN: import.meta.env.VITE_NATIVE_COIN,
} as unknown as {
    DEV: boolean;
    PROD: boolean;
    ENDPOINT_RPC: string;
    ENDPOINT_BACK_END_API: string;
    ENPOINT_API: string;
    STORE_ADDRESS: string;
    NATIVE_COIN: string;
}



type Entry = { key: string; value: unknown };
type EmptyEntry<TValue> = { key: ''; value: TValue };
type ExcludedTypes = Date | Set<unknown> | Map<unknown, unknown>;
type ArrayEncoder = `[${bigint}]`;

type EscapeArrayKey<TKey extends string> = TKey extends `${infer TKeyBefore}.${ArrayEncoder}${infer TKeyAfter}`
    ? EscapeArrayKey<`${TKeyBefore}${ArrayEncoder}${TKeyAfter}`>
    : TKey;

// Transforms entries to one flattened type
type CollapseEntries<TEntry extends Entry> = {
    [E in TEntry as EscapeArrayKey<E['key']>]: E['value'];
};

// Transforms array type to object
type CreateArrayEntry<TValue, TValueInitial> = OmitItself<
    TValue extends unknown[] ? { [k: ArrayEncoder]: TValue[number] } : TValue,
    TValueInitial
>;

// Omit the type that references itself
type OmitItself<TValue, TValueInitial> = TValue extends TValueInitial
    ? EmptyEntry<TValue>
    : OmitExcludedTypes<TValue, TValueInitial>;

// Omit the type that is listed in ExcludedTypes union
type OmitExcludedTypes<TValue, TValueInitial> = TValue extends ExcludedTypes
    ? EmptyEntry<TValue>
    : CreateObjectEntries<TValue, TValueInitial>;

type CreateObjectEntries<TValue, TValueInitial> = TValue extends object
    ? {
        // Checks that Key is of type string
        [TKey in keyof TValue]-?: TKey extends string
        ? // Nested key can be an object, run recursively to the bottom
        CreateArrayEntry<TValue[TKey], TValueInitial> extends infer TNestedValue
        ? TNestedValue extends Entry
        ? TNestedValue['key'] extends ''
        ? {
            key: TKey;
            value: TNestedValue['value'];
        }
        :
        | {
            key: `${TKey}.${TNestedValue['key']}`;
            value: TNestedValue['value'];
        }
        | {
            key: TKey;
            value: TValue[TKey];
        }
        : never
        : never
        : never;
    }[keyof TValue] // Builds entry for each key
    : EmptyEntry<TValue>;

export type FlattenObject<TValue> = CollapseEntries<CreateObjectEntries<TValue, TValue>>;


export const capitalize = (str: string) => `${str[0].toUpperCase()}${str.slice(1)}`

//@ts-ignore
window.suggestCahin = async ()=>{
    await window.keplr?.experimentalSuggestChain({
        chainId: "test-1",
        chainName: "neutron",
        rpc: "http://localhost:26657",
        rest: "http://localhost:1317",
        bip44: {
            coinType: 118,
        },
        bech32Config: {
            bech32PrefixAccAddr: "neutron",
            bech32PrefixAccPub: "neutron" + "pub",
            bech32PrefixValAddr: "neutron" + "valoper",
            bech32PrefixValPub: "neutron" + "valoperpub",
            bech32PrefixConsAddr: "neutron" + "valcons",
            bech32PrefixConsPub: "neutron" + "valconspub",
        },
        currencies: [ 
            { 
                coinDenom: "NTRN", 
                coinMinimalDenom: "untrn", 
                coinDecimals: 6, 
                coinGeckoId: "neutron-3", 
            }, 
        ],
        feeCurrencies: [
            {
                coinDenom: "NTRN",
                coinMinimalDenom: "untrn",
                coinDecimals: 6,
                coinGeckoId: "neutron-3", 
                gasPriceStep: {
                    low: 0.01,
                    average: 0.025,
                    high: 0.04,
                },
            },
        ],
        stakeCurrency: {
            coinDenom: "NTRN",
            coinMinimalDenom: "untrn",
            coinDecimals: 6,
            coinGeckoId: "neutron-3",
        },
    });
    
}
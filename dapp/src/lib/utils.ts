import { toBase64, fromBase64, toBech32, fromBech32 } from "@cosmjs/encoding"
import { addIbcTx, type CoinData } from "../stores/coins";
import { SigningStargateClient } from "@cosmjs/stargate";
import { MsgTransfer, MsgTransferResponse } from "cosmjs-types/ibc/applications/transfer/v1/tx"
import { Decimal, Uint32 } from "@cosmjs/math";
import { GasPrice } from "@cosmjs/stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";



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

    console.log(coin);
    return tx
}


export const multiply_ratio = (a: Decimal, [b, c]: [number, number]) => {
    let ba = BigInt(a.atomics);
    let newA = (ba * BigInt(b) / BigInt(c)).toString();
    return Decimal.fromAtomics(newA, a.fractionalDigits)
}


export const uploadImage = (multiple: boolean = false): Promise<{
    url: string;
}[]> => {
    return new Promise(resolve => {
        let ipt = document.createElement('input');
        ipt.type = "file"
        ipt.accept = "image/*"
        ipt.multiple = multiple;
        ipt.onchange = (e) => {
            if (ipt.files) {
                let files = Promise.all(Array.from(ipt.files).map(e => {
                    return new Promise<{url:string}>(resolve => {
                        const reader = new FileReader();
                        reader.onloadend = ()=>{
                            resolve({url: reader.result as string})
                        }
                        reader.readAsDataURL(e)
                    })
                }));
                files.then(e => resolve(e))
            } else {
                resolve([])
            }
        }
        ipt.click()
    })
}



export const id = () => {
    const dateString = Date.now().toString(36);
    const randomness = Math.random().toString(36).substr(2);
    return dateString + randomness;
};


export const getNames = async (address: string) => {
    return Promise.all([{
        rpc: "https://stargaze-rpc.publicnode.com:443",
        contract: "stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr",
        prefix: 'stars'
    }].map(async ({ rpc, contract, prefix }) => {
        console.log(address);
        const client = await CosmWasmClient.connect(rpc);

        try {
            let res = await client.queryContractSmart(contract, {
                name: { address: toPrefix(address, prefix) },
            }) as string;
            return res;
        } catch (e) {
        }
        return ""
    })).then(e => e.filter(a => a !== ""));
}

export const intersect = <T>(a:T[], b:T[])=>{
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


export const eq = <T,K>(a:T,b:K)=>{
    if(typeof a !== typeof b) return false;
    if(Array.isArray(a) && Array.isArray(b)){
        if(a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if(!eq(a[i], b[i])){
                return false;
            }
        }
        return true;
    }
    if(typeof a === 'object' && typeof b === 'object' && a !== null && b!== null && Object.prototype.toString.call(a) === Object.prototype.toString.call(b) 
        && Object.prototype.toString.call(a) === '[object Object]'){
        let ks = Object.keys(a);
        if(ks.length !== Object.keys(b).length){
            for(const key of ks){
                if(!('key' in b)) return false;
                //@ts-ignore
                if(!eq(a[key], b[key])) return false;
            }
            return true;
        }
    }
    //@ts-ignore
    return a === b
}
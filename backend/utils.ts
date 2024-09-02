import "bun";
import { Secp256k1, Secp256k1Signature, sha256 } from '@cosmjs/crypto';
import { fromBase64, fromBech32, toBech32 } from '@cosmjs/encoding';
import {
    serializeSignDoc,
} from '@cosmjs/amino';
import { StatusCode } from 'hono/utils/http-status';
import { ProductMetaData } from "../shared-types";
import stringify from 'json-stable-stringify'
import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";


export const verifySignature = async (message: string, signature) => {
    const signDoc = {
        chain_id: '',
        account_number: '0',
        sequence: '0',
        fee: {
            gas: '0',
            amount: [],
        },
        msgs: [
            {
                type: 'sign/MsgSignData',
                value: {
                    signer: toPrefix(signature.address, "cosmos"),
                    data: Buffer.from(message).toString('base64'),
                },
            },
        ],
        memo: '',
    };
    const valid = await Secp256k1.verifySignature(
        Secp256k1Signature.fromFixedLength(fromBase64(signature.signature)),
        sha256(serializeSignDoc(signDoc)),
        Buffer.from(signature.pub_key.value, 'base64'),
    );
    return valid;
};


export const hash = (str: string) => {
    return Buffer.from(sha256(Buffer.from(str))).toString('hex');
}

export const productMetaHash = (p:ProductMetaData)=>{
    let cpy:Partial<ProductMetaData> = structuredClone(p);
    delete cpy.id;
    return hash(stringify(cpy)).toLowerCase();
}

export const toPrefix = (addr: string, prefix: string) => {
    let origin = fromBech32(addr);
    return toBech32(prefix, origin.data);
}

export class ServerError extends Error {
    code: StatusCode
    constructor(message, code) {
        super(message)
        this.code = code;
    }
}

export const errors = {
    UNKNOWN_ERROR: "Unknown error",
    UNAUTHORIZED: "Unauthorized"
} as const;

export function assert(assertion: boolean, message: string, code: number = 400): asserts assertion {
    if (!assertion) {
        throw new ServerError(message, code)
    }
}

export const getUniqueCollectionId = (address: string, collection_id: string) => {
    return `${address}-${hash(collection_id).substring(0, 10)}`
}

export const validateAddress = (address: string) => {
    try {
        toPrefix(address, "cosmos")
    } catch {
        throw new ServerError("address not valid", 400)
    }
}


export function capitalize(word: string): string {
    return `${word[0].toLocaleUpperCase()}${word.slice(1)}`
}


export const extractAttr = (attr: string, resp: ExecuteResult) => {
    const attrs = resp.events.filter(e => e.type == 'wasm').map(e => e.attributes).flat()
    return attrs.find(a => a.key === attr)?.value
}

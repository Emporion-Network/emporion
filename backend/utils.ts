import { Secp256k1, Secp256k1Signature, sha256 } from '@cosmjs/crypto';
import { fromBase64, fromBech32, toBech32 } from '@cosmjs/encoding';
import {
    serializeSignDoc,
} from '@cosmjs/amino';
import { StatusCode } from 'hono/utils/http-status';
import { cos_sim, pipeline } from "@xenova/transformers";

export const verifySignature = async (message:string, signature) => {
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


export const hash = (str:string)=>{
    return Buffer.from(sha256(Buffer.from(str))).toString('hex');
}

export const toPrefix = (addr: string, prefix: string) => {
    let origin = fromBech32(addr);
    return toBech32(prefix, origin.data);
}

export class ServerError extends Error {
    code:StatusCode
    constructor(message, code){
        super(message)
        this.code = code;
    }
}

export const errors = {
     UNKNOWN_ERROR:"Unknown error",
     UNAUTHORIZED:"Unauthorized"
} as const;

export function assert(assertion:boolean, message:string, code:number=400):asserts assertion{
    if(!assertion){
        throw new ServerError(message, code)
    }
}

export const getUniqueCollectionId = (address:string, collection_id:string)=>{
    return `${address}-${hash(collection_id).substring(0, 10)}`
}

export const validAddress = (address:string)=>{
    try {
        toPrefix(address, "cosmos")
    } catch {
        throw new ServerError("address not valid", 400)
    }
}

const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
export const embed = async (t:string)=>{
    const a1 = (await extractor(t, {pooling:"mean", normalize:true})).data;
    return a1
  }

  export const textSim = async (a1:number[], a2:number[])=>{
    const output = cos_sim(a1, a2)
    return output;
  }
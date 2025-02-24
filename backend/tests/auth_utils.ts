import { serializeSignDoc } from '@cosmjs/amino';
import { Secp256k1, Random, ripemd160, sha256 } from '@cosmjs/crypto';
import { toBech32, toBase64 } from '@cosmjs/encoding';

import { Api, assertSucess, type RequestToken } from '../../ts-client/api';
export const sign = (address: string, nonce: string) => {
  return serializeSignDoc({
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
          signer: address,
          data: Buffer.from(nonce).toString('base64'),
        },
      },
    ],
    memo: '',
  });
};

export const getSigningMaterial = async () => {
  const kp = await Secp256k1.makeKeypair(Random.getBytes(32));
  const pubKey = Secp256k1.compressPubkey(kp.pubkey);
  const addr = toBech32('cosmos', ripemd160(sha256(pubKey)));
  return {
    privkey: kp.privkey,
    pubkey: pubKey,
    addr,
  };
};

export const signReq = async (addr: string, nonce: string, pubkey: Uint8Array, privkey: Uint8Array) => {
  const hash = sha256(sign(addr, nonce));
  const signature = await Secp256k1.createSignature(hash, privkey);
  const sig = toBase64(Secp256k1.trimRecoveryByte(signature.toFixedLength()));

  const req = {
    nonce: nonce,
    signature: sig,
    pubKey: {
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(pubkey),
    },
  } satisfies RequestToken['req'];
  return req;
};

export const getSignedApi = async () => {
  const api = new Api('http://localhost:3000', true);
  const kp = await Secp256k1.makeKeypair(Random.getBytes(32));
  const pubKey = Secp256k1.compressPubkey(kp.pubkey);
  const addr = toBech32('cosmos', ripemd160(sha256(pubKey)));
  const res = await api.requestNonce({ addr: addr });
  assertSucess(res);
  const nonce = res.result;
  const hash = sha256(sign(addr, nonce));
  const signature = await Secp256k1.createSignature(hash, kp.privkey);
  const sig = toBase64(Secp256k1.trimRecoveryByte(signature.toFixedLength()));
  const req = {
    nonce: nonce,
    signature: sig,
    pubKey: {
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(pubKey),
    },
  } satisfies RequestToken['req'];
  await api.requestToken(req);
  return { api, addr };
};

export const waitOpen = (ws: WebSocket) => new Promise<[Event]>((resolve) => {
  ws.onopen = (...params) => {
    resolve(params);
  };
  if (ws.readyState == ws.OPEN) {
    resolve([new Event('')]);
  }
});

export const waitMesssage = (ws: WebSocket) => new Promise<[MessageEvent]>((resolve) => {
  ws.onmessage = (...params) => {
    resolve(params);
  };
});

export const waitClose = (ws: WebSocket) => new Promise<[CloseEvent]>((resolve) => {
  ws.onclose = (...params) => {
    resolve(params);
  };
});

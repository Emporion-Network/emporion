import type { State } from '@/state';
import type { RequestNonce, RequestToken } from '@common';
import { assert, assertIsDefinedUnsafe, assertIsValidUpdateUserData, isValidBech } from '@common';
import {
  serializeSignDoc,
} from '@cosmjs/amino';
import { Secp256k1, Secp256k1Signature, sha256, ripemd160 } from '@cosmjs/crypto';
import {
  fromBase64,
  toBech32,
} from '@cosmjs/encoding';
import { Hono } from 'hono';
import { Jwt } from 'hono/utils/jwt';
import { setCookie } from 'hono/cookie';
import { jwt } from '@/middlewares/jwt';

const verifySignature = async (signature: RequestToken['req']) => {
  try {
    const sig = Secp256k1Signature.fromFixedLength(fromBase64(signature.signature));
    const address = toBech32('cosmos', ripemd160(sha256(Buffer.from(signature.pubKey.value, 'base64'))));
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
            signer: address,
            data: Buffer.from(signature.nonce).toString('base64'),
          },
        },
      ],
      memo: '',
    };
    const valid = await Secp256k1.verifySignature(
      sig,
      sha256(serializeSignDoc(signDoc)),
      Buffer.from(signature.pubKey.value, 'base64'),
    );
    return valid ? address : undefined;
  } catch {
    //
  };
};

const requestToken = new Hono<{ Variables: { state: State } }>()
  .post('/request_token', async (c) => {
    const signature = await c.req.json<RequestToken['req']>();
    assertIsDefinedUnsafe(signature, 'invalid request');
    assertIsDefinedUnsafe(signature.nonce, 'invalid request');
    assertIsDefinedUnsafe(signature.pubKey, 'invalid request');
    assertIsDefinedUnsafe(signature.signature, 'invalid request');
    const address = await verifySignature(signature);
    assertIsDefinedUnsafe(address, 'invalid signature');
    assert(c.var.state.checkNonce(address, signature.nonce), 'invalid nonce');
    const token = await Jwt.sign({
      addr: address,
      exp: (Date.now() + c.var.state.jwtLifetime) / 1e3,
    }, c.var.state.jwtSecret);

    setCookie(c, 'token', token, {
      httpOnly: true,
      maxAge: c.var.state.jwtLifetime / 1e3,
    });

    return c.json({
      error: false,
      result: token,
    } satisfies RequestToken['res']);
  })
  .post('/request_nonce', async (c) => {
    const r = await c.req.json() as RequestNonce['req'];
    assertIsDefinedUnsafe(r, 'addr is required');
    assert(isValidBech(r.addr), 'addr format is invalid');
    const nonce = c.var.state.getNonce(r.addr);
    return c.json({
      error: false,
      result: nonce,
    } satisfies RequestNonce['res']);
  })
  .use('/check_token', jwt)
  .get('/check_token', async (c) => {
    return c.json({
      error: false,
    });
  })
  .use('/user-data', jwt)
  .get('/user-data', async (c) => {
    const state = c.var.state;
    return c.json({
      error: false,
      result: await state.db.getUserData(c.var.user.addr),
    });
  })
  .use('/update-user-data', jwt)
  .post('/update-user-data', async (c) => {
    const updateData = await c.req.json();
    assertIsValidUpdateUserData(updateData);
    const res = await c.var.state.db.updateUserData(c.var.user.addr, updateData);
    return c.json({
      error: false,
      result: res,
    });
  });

export default requestToken;

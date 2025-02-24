import { expect, test } from 'bun:test';
import { Api, assertSucess } from '../../ts-client/api';
import { getSignedApi, getSigningMaterial, signReq } from './auth_utils';

test('request_token should succeed', async () => {
  const api = new Api('http://localhost:3000');
  const {
    addr,
    privkey,
    pubkey,
  } = await getSigningMaterial();
  const res = await api.requestNonce({ addr: addr });
  expect(res.error).toBe(false);
  assertSucess(res);
  const nonce = res.result;
  const req = await signReq(addr, nonce, pubkey, privkey);
  const rest = await api.requestToken(req);
  expect(rest.error).toBe(false);
});

test('request_token should fail on invalid signature', async () => {
  const api = new Api('http://localhost:3000');
  const {
    addr,
    privkey,
    pubkey,
  } = await getSigningMaterial();
  const res = await api.requestNonce({ addr: addr });
  expect(res.error).toBe(false);
  assertSucess(res);
  const nonce = res.result;
  const req = await signReq(addr, nonce, pubkey, privkey);
  req.signature += 'mingle the signature';
  const rest = await api.requestToken(req);
  expect(rest.error).toBe(true);
});

test('request_token should fail on different nonce', async () => {
  const api = new Api('http://localhost:3000');
  const {
    addr,
    privkey,
    pubkey,
  } = await getSigningMaterial();
  const res = await api.requestNonce({ addr: addr });
  expect(res.error).toBe(false);
  assertSucess(res);
  const nonce = res.result;
  const req = await signReq(addr, nonce, pubkey, privkey);
  req.nonce += 'mingle the nonce';
  const rest = await api.requestToken(req);
  expect(rest.error).toBe(true);
});

test('check_token should fail when no token is present', async () => {
  const api = new Api('http://localhost:3000');
  const r = await api.checkToken();
  expect(r.error).toBe(true);
});

test('check_token shoud succeed', async () => {
  const { api } = await getSignedApi();
  const r = await api.checkToken();
  expect(r.error).toBe(false);
});

import { expect, test, beforeAll } from 'bun:test';
import { Api, assertSucess } from '../../ts-client/api';

let api: Api;

beforeAll(() => {
  api = new Api('http://localhost:3000');
});

test('request_nonce invalid address', async () => {
  const res = await api.requestNonce({ addr: 'test' });
  expect(res.error).toBe(true);
});

test('request_nonce valid address', async () => {
  const res = await api.requestNonce({ addr: 'cosmos1m9l358xunhhwds0568za49mzhvuxx9uxre5tud' });
  assertSucess(res);
  expect(res.result).toBeString();
  const res2 = await api.requestNonce({ addr: 'cosmos1m9l358xunhhwds0568za49mzhvuxx9uxre5tud' });
  expect(res2.error).toBe(false);
  assertSucess(res2);

  const newNoce = res2.result;
  const prevNonce = res.result;

  expect(newNoce).toBe(prevNonce);
});

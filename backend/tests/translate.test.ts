import { expect, test } from 'bun:test';
import { getSignedApi } from './auth_utils';
import { assertSucess } from '../../ts-client/api';

test('shoudl translate', async () => {
  const { api } = await getSignedApi();
  const res = await api.translate({ en: 'hello', fr: '' });
  console.log(res);
  expect(res.error).toBe(false);
  assertSucess(res);
  expect(res.result['fr']).toBe('bonjour');
});

test('translate should fail if no token', async () => {
  const { api } = await getSignedApi();
  api.token = '';
  const res = await api.translate({ en: 'hello', fr: '' });
  expect(res.error).toBe(true);
});

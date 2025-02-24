import { expect, test } from 'bun:test';
import { getSignedApi, waitMesssage, waitOpen } from './auth_utils';
import type { ChatMessage } from '@common';

test('can send messages to eachother', async () => {
  const { api: apiAlice, addr: addrAlice } = await getSignedApi();
  const { api: apiBob, addr: addrBob } = await getSignedApi();
  const wsAlice = new WebSocket('ws://localhost:3000/ws');
  const wsBob = new WebSocket('ws://localhost:3000/ws');
  // Auth alice
  await waitOpen(wsAlice);
  wsAlice.send(apiAlice.token);
  await waitMesssage(wsAlice);
  // Auth bob
  await waitOpen(wsBob);
  wsBob.send(apiBob.token);
  await waitMesssage(wsBob);
  // Alice to bob
  wsAlice.send(JSON.stringify({
    to: addrBob,
    chatId: '1',
    message: 'hello 👋',
  } satisfies ChatMessage['send']));
  let [res] = await waitMesssage(wsBob);
  let msg = JSON.parse(String(res.data)) as ChatMessage['recv'];
  expect(msg.chatId).toBe('1');
  expect(msg.from).toBe(addrAlice);
  expect(msg.message).toBe('hello 👋');

  /// Bob to Alice
  wsBob.send(JSON.stringify({
    to: addrAlice,
    chatId: '2',
    message: 'hi 👋',
  } satisfies ChatMessage['send']));
  [res] = await waitMesssage(wsAlice);
  msg = JSON.parse(String(res.data)) as ChatMessage['recv'];
  expect(msg.chatId).toBe('2');
  expect(msg.from).toBe(addrBob);
  expect(msg.message).toBe('hi 👋');
});

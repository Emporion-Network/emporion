import { Hono, type Context } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import type { State } from '@/state';
import { Jwt } from 'hono/utils/jwt';
import { assert, assertIsDefinedUnsafe, isString, isValidBech } from '@common';
import type { ChatMessage } from '@common';

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket<{ addr: string }>>();

const ERROR_CODE = 1008;

const wsHandler = new Hono<{ Variables: { state: State } }>()
  .get('/ws', upgradeWebSocket((c: Context<{ Variables: { state: State, addr: string } }>) => {
    return {
      onMessage: async (event, ws) => {
        try {
          if (!ws.raw) return;
          if (!ws.raw?.data.addr) {
            const token = event.data.toString();
            const r = await Jwt.verify(token, c.var.state.jwtSecret);
            ws.raw.data.addr = r.addr as string;
            c.var.state.addSocket(ws.raw.data.addr, ws);
            ws.send('ok');
          } else if (ws.raw?.data.addr) {
            const d = event.data.toString();
            const msg = JSON.parse(d) as ChatMessage['send'];
            assertIsDefinedUnsafe(msg, '');
            assert(isString(msg.chatId), '');
            assert(isString(msg.message), '');
            assert(isValidBech(msg.to), '');
            const s = c.var.state.getSocket(msg.to);
            if (!s) return;
            /// TODO validate chatId
            s.send(JSON.stringify({
              chatId: msg.chatId,
              message: msg.message,
              from: ws.raw.data.addr,
              at: Date.now(),
            } satisfies ChatMessage['recv']));
          }
        } catch {
          ws.close(ERROR_CODE);
        }
      },
      onClose(_, ws) {
        if (ws.raw?.data.addr) {
          c.var.state.removeSocket(ws.raw.data.addr);
        }
      },
    };
  }));

export {
  wsHandler,
  websocket,
};

import type { State } from '@/state';
import { createMiddleware } from 'hono/factory';
import {
  getCookie,
} from 'hono/cookie';
import { assertIsDefinedUnsafe } from '@common';
import { Jwt } from 'hono/utils/jwt';

export const jwt = createMiddleware<{
  Variables: {
    state: State
    user: {
      addr: string
    }
  }
}>(async (c, next) => {
  let token = getCookie(c, 'token');
  if (!token) {
    const v = c.req.header('Authorization');
    if (v?.startsWith('Bearer ')) {
      token = v.substring(7);
    }
  }
  assertIsDefinedUnsafe(token, 'missing token');
  const user = await Jwt.verify(token, c.var.state.jwtSecret);
  assertIsDefinedUnsafe(user.addr, 'invalid token');
  c.set('user', {
    addr: user.addr as string,
  });
  await next();
});

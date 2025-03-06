import { jwt } from '@/middlewares/jwt';
import type { State } from '@/state';
import { assertIsValidUpdateUserData } from '@common';
import { Hono } from 'hono';

export default new Hono<{ Variables: { state: State } }>()
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

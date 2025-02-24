import type { State } from '@/state';
import { Hono } from 'hono';
import { assert, assertIsValidMetadata, bechToBech, isValidBech, type ProductMetadata } from '@common';
import { jwt } from '@/middlewares/jwt';

const app = new Hono<{ Variables: { state: State } }>()
  .use('/upload-metadata', jwt)
  .post('/upload-metadata', async (c) => {
    const state = c.var.state;
    const metadata = await c.req.json();
    assert(Array.isArray(metadata), 'invalid metadata');
    assert(metadata.length > 0, 'invalid metadata');
    metadata.forEach((m: ProductMetadata) => {
      assertIsValidMetadata(m);
    });
    const addr = c.var.user.addr;
    const ids = metadata.map((m: ProductMetadata) => {
      return state.db.getId({
        ...m,
        seller: addr,
      });
    });
    return c.json({
      error: false,
      result: ids,
    });
  })
  .get('/collections/:addr', async (c) => {
    const state = c.var.state;
    let addr = c.req.param('addr');
    assert(isValidBech(addr), 'invalid address');
    addr = bechToBech(addr, 'cosmos');
    const collections = (await state.db.getCollections(addr));
    collections.forEach(p => p.products.forEach((p) => {
      // @ts-expect-error - price is a bigint
      p.price = p.price.toString();
    }));
    return c.json({
      error: false,
      result: collections,
    });
  });
export default app;

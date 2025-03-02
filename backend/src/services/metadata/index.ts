import type { State } from '@/state';
import { Hono } from 'hono';
import { assert, assertIsValidMetadata, bechToBech, isValidBech, type ProductMetadata } from '@common';
import { jwt } from '@/middlewares/jwt';
import { randomUUIDv7 } from 'bun';

const app = new Hono<{ Variables: { state: State } }>()
  .use('/upload-metadata', jwt)
  .post('/upload-metadata', async (c) => {
    const state = c.var.state;
    const metadata = await c.req.json();
    assert(Array.isArray(metadata), 'invalid metadata');
    assert(metadata.length > 0, 'invalid metadata');

    const ids = await Promise.all(metadata.map(async (m: ProductMetadata) => {
      assertIsValidMetadata(m);
      m.seller = c.var.user.addr;
      const id = randomUUIDv7();
      const url = `https://${state.domainName}/api/metadata/${id}`;
      await state.fs.write(`metadata/${id}`, JSON.stringify({
        ...m,
        metadata_url: url,
      }), {
        type: 'application/json',
        acl: 'public-read',
      });
      return url;
    }));
    return c.json({
      error: false,
      result: ids,
    });
  })
  .use('/update-metadata', jwt)
  .post('/update-metadata', async (c) => {
    const state = c.var.state;
    const metadata = await c.req.json();
    assert(Array.isArray(metadata), 'invalid metadata');
    assert(metadata.length > 0, 'invalid metadata');

    const ids = await Promise.all(metadata.map(async (m: ProductMetadata) => {
      assertIsValidMetadata(m);
      m.seller = c.var.user.addr;
      const metadata_id = m.metadata_url?.split('/').pop() || '';
      const old = await state.fs.file(`metadata/${metadata_id}`).json();
      const url = `https://${state.domainName}/api/metadata/${metadata_id}`;
      assert(old.seller === c.var.user.addr, 'you are not the owner of this metadata');
      await state.fs.write(`metadata/${metadata_id}`, JSON.stringify({
        ...m,
        id: old.id,
        seller: old.seller,
      }), {
        type: 'application/json',
        acl: 'public-read',
      });
      return url;
    }));
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
  })
  .get('/metadata/:id', async (c) => {
    try {
      const state = c.var.state;
      const id = c.req.param('id');
      const metadata = await state.fs.file(`/metadata/${id}`);
      return c.body(metadata.stream());
    } catch {
      return c.json({
        error: true,
        message: 'metadata not found',
      });
    }
  })
  .get('/scroll-products', async (c) => {
    const {
      limit,
      category,
      start_after,
      search,
      seller,
      sort,
      min_price,
      max_price,
    } = c.req.query();
    const res = await c.var.state.db.scrollProducts({
      start_after,
      limit,
      category,
      search,
      seller,
      sort,
      min_price,
      max_price,
    });
    return c.json({
      error: false,
      result: res,
    });
  });
export default app;

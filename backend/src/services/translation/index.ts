import { Hono } from 'hono';
import type { State } from '@/state';
import { jwt } from '@/middlewares/jwt';
import { assert, assertIsDefinedUnsafe, isString } from '@common';
import { template } from './template';

const translate = new Hono<{ Variables: { state: State } }>()
  .use('/translate', jwt)
  .post('/translate', async (c) => {
    const key = c.var.state.translationApiKey;
    const msg = await c.req.json() as Record<string, string>;
    assertIsDefinedUnsafe(msg, 'invalid request');
    Object.keys(msg).forEach((k) => {
      assert(isString(msg[k]), 'invalid request');
    });
    const qry = await fetch(c.var.state.translationApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(template(JSON.stringify(msg))),
    });
    assert(qry.ok, 'Service unavailable');
    const data = await qry.json();
    assert(data.choices.length > 0, 'Service unavailable');
    const resp = JSON.parse(data.choices[0].message.content);
    return c.json({
      error: false,
      result: resp,
    });
  });

export default translate;

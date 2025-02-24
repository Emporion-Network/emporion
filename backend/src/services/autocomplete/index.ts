import { Hono } from 'hono';
import type { State } from '@/state';
import { jwt } from '@/middlewares/jwt';
import { assert, assertIsDefinedUnsafe, isString, type Autocomplete } from '@common';
import { template } from './template';

const translate = new Hono<{ Variables: { state: State } }>()
  .use('/autocomplete', jwt)
  .post('/autocomplete', async (c) => {
    const key = c.var.state.translationApiKey;
    const msg = await c.req.json() as Autocomplete['req'];
    assertIsDefinedUnsafe(msg, 'invalid request');
    assert(isString(msg.description), 'invalid request');
    const qry = await fetch(c.var.state.translationApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(template(JSON.stringify(msg.description))),
    });
    assert(qry.ok, 'Service unavailable');
    const data = await qry.json();
    assert(data.choices.length > 0, 'Service unavailable');
    const suggestions = data.choices.map((m: { message: { content: string } }) => m.message.content.replaceAll('"', ''));
    return c.json({
      error: false,
      result: suggestions,
    });
  });

export default translate;

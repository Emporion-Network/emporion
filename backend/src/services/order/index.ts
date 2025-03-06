import { jwt } from '@/middlewares/jwt';
import type { State } from '@/state';
import { assert, assertIsValidOrderData, assertIsValidSetTrackingNumberReq, bechToBech } from '@common';
import { Hono } from 'hono';

export default new Hono<{ Variables: { state: State } }>()
  .use('/create-order', jwt)
  .post('/create-order', async (c) => {
    const orderData = await c.req.json();
    assertIsValidOrderData(orderData);
    const buyer = c.var.user.addr;
    const ec = c.var.state.blockchain.ec;
    if (!ec) return;
    const onchin = await ec.getOrder({ id: orderData.id });
    assert(bechToBech(onchin?.buyer, 'cosmos') == buyer, 'Unothorized');
    await c.var.state.db.createOrderData({
      id: orderData.id,
      seller: bechToBech(onchin.seller, 'cosmos'),
      buyer,
      postalAddress: orderData.postalAddress,
    });
    return c.json({
      error: false,
    });
  })
  .use('/order-data/:id', jwt)
  .get('/order-data/:id', async (c) => {
    const addr = c.var.user.addr;
    const id = c.req.param('id');
    const orderData = await c.var.state.db.getOrderData(id);
    if (!orderData) {
      return c.json({
        error: true,
        message: 'not found',
      });
    }
    assert(orderData?.seller === addr || orderData?.buyer === addr, 'Unauthorized');
    return c.json({
      error: false,
      result: orderData,
    });
  })
  .use('/set-tracking-number', jwt)
  .post('/set-tracking-number', async (c) => {
    const trackingReq = await c.req.json();
    assertIsValidSetTrackingNumberReq(trackingReq);
    const orderData = await c.var.state.db.getOrderData(trackingReq.id);
    if (!orderData) {
      return c.json({
        error: true,
        message: 'order not found',
      });
    }
    assert(orderData.seller == c.var.user.addr, 'Unauthorized');
    orderData.trackingNumber = trackingReq.trackingNumber;
    await c.var.state.db.updateOrderData(orderData.id, orderData);
    return c.json({
      error: false,
    });
  });

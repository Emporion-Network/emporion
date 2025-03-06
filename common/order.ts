import { assert, assertIsDefinedUnsafe, assertIsValidPostalAddress, isString, type OrderData, type PostalAddress, type Result } from ".";

export interface CreateOrderData {
  id: string,
  postalAddress: PostalAddress,
}

export interface ReqCreateOrderData {
  req: CreateOrderData,
  res: Result<{}>,
  method: 'post',
  path: '/create-order'
}

export interface ReqOrderData {
  req: string,
  res: Result<OrderData>,
  method: 'get',
  path: `/order-data/${string}`
}

export interface ReqSetTrackingNumber {
  req: {
    id: string,
    trackingNumber: string
  },
  res: Result<{}>,
  method: 'post',
  path: '/set-tracking-number'
}

export function assertIsValidSetTrackingNumberReq(req: unknown): asserts req is ReqSetTrackingNumber['req'] {
  assertIsDefinedUnsafe<ReqSetTrackingNumber['req']>(req, 'Invalid tracking request');
  assert(isString(req.id), 'invalid id')
  assert(isString(req.trackingNumber), 'invalid id')
}

export function assertIsValidOrderData(orderData: unknown): asserts orderData is CreateOrderData {
  assertIsDefinedUnsafe<CreateOrderData>(orderData, 'invalid OrderData');
  assert(isString(orderData.id), 'invalid id');
  assertIsValidPostalAddress(orderData.postalAddress);
}
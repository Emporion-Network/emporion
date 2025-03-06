import { assert, assertIsDefinedUnsafe, isString, type Result } from ".";


export interface Notification {
  type: 'create_order',
  id: string
}

export interface UserData {
  postalAddresses: {
    postalAddress: string,
    name: string,
  }[],
  addr: string,
  id: string,
  positiveProducts: number[],
  negativeProducts: number[],
  notifications: Notification[],
}

export type PostalAddress = UserData["postalAddresses"][number];

export interface UpdateUserData {
  postalAddresses: {
    postalAddress: string,
    name: string,
  }[],
  positiveProducts: number[],
  negativeProducts: number[],
}


export interface CreateOrderData {
  id: string,
  postalAddress: PostalAddress,
}

export function assertIsValidPostalAddress(postalAddress: unknown): asserts postalAddress is PostalAddress {
  assertIsDefinedUnsafe<PostalAddress>(postalAddress, 'invalid address');
  assert(isString(postalAddress.name), 'invalid name');
  assert(isString(postalAddress.postalAddress), 'invalid postalAddress');
}

export function assertIsValidUpdateUserData(userData: unknown): asserts userData is UpdateUserData {
  assertIsDefinedUnsafe<UpdateUserData>(userData, 'UpdateUserData is undefined');
  assert(Array.isArray(userData.postalAddresses), 'postalAddresses is not valid');
  assert(userData.postalAddresses.length < 100, 'postalAddresses is not valid');
  userData.postalAddresses.forEach((a, i) => {
    assertIsValidPostalAddress(a);
    userData.postalAddresses[i] = {
      name: a.name,
      postalAddress: a.postalAddress
    }
  })
  assert(Array.isArray(userData.positiveProducts), 'positiveProducts is not valid');
  assert(Array.isArray(userData.negativeProducts), 'negativeProducts is not valid');
  userData.positiveProducts.forEach((a) => {
    assert(Number.isInteger(a), 'invalid id');
  })

  userData.positiveProducts.forEach((a) => {
    assert(Number.isInteger(a), 'invalid id');
  })
}



export function assertIsValidOrderData(orderData: unknown): asserts orderData is CreateOrderData {
  assertIsDefinedUnsafe<CreateOrderData>(orderData, 'invalid OrderData');
  assert(isString(orderData.id), 'invalid id');
  assertIsValidPostalAddress(orderData.postalAddress);
}

export interface ReqUserData {
  req: never,
  res: Result<UserData>
  method: 'get'
  path: '/user-data'
}


export interface ReqUpdateUserData {
  req: UpdateUserData,
  res: Result<UserData>
  method: 'post'
  path: '/update-user-data'
}

export interface ReqCreateOrderData {
  req: CreateOrderData,
  res: Result<{}>,
  method: 'post',
  path: '/create-order'
}
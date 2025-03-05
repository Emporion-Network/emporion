import { assert, assertIsDefinedUnsafe, isString, type Result } from ".";
import type { BlockchainEvent } from "./blockchain";

export interface UserData {
  postalAddresses: {
    postalAddress: string,
    name: string,
  }[],
  addr: string,
  id: string,
  positiveProducts: number[],
  negativeProducts: number[],
  notifications: BlockchainEvent[],
}

export interface UpdateUserData {
  postalAddresses: {
    postalAddress: string,
    name: string,
  }[],
  positiveProducts: number[],
  negativeProducts: number[],
}

export function assertIsValidUpdateUserData(userData: unknown): asserts userData is UpdateUserData {
  assertIsDefinedUnsafe<UpdateUserData>(userData, 'UpdateUserData is undefined');
  assert(Array.isArray(userData.postalAddresses), 'postalAddresses is not valid');
  assert(userData.postalAddresses.length < 100, 'postalAddresses is not valid');
  userData.postalAddresses.forEach((a, i) => {
    assertIsDefinedUnsafe(a, 'invalid address');
    assert(isString(a.name), 'invalid name');
    assert(isString(a.postalAddress), 'invalid postalAddress');
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
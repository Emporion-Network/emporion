/**
 * Utils should not depend on anything that doesn't work
 * both on the frontend and backend as this file
 * could be in both cases
 */

import { fromBech32, toBech32 } from '@cosmjs/encoding';

export const bechToBech = (addr: string, prefix: string) => {
  return toBech32(prefix, fromBech32(addr).data);
};

export function into<T>(_x: unknown): asserts _x is T { /**/ };

export const isString = (v: string) => {
  return typeof v === 'string';
};

export const isUrl = (v: string) => {
  try {
    const url = new URL(v);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

export const isBoolean = (v: boolean) => {
  return typeof v === 'boolean';
};

export const isHexColor = (v: string) => {
  // 3 4 6 8
  return /^#?([a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(v);
};

export const isValidBech = (addr: string) => {
  try {
    fromBech32(addr);
    return true;
  } catch {
    return false;
  }
};

/**
 * @throws if value is not defined or NaN or null
 * @typeParam T - v will be **unsafely** casted to T make sure you do all additional checks
 * @param v - value to be tested
 * @param msg - error message
 *
 * TODO: Migrate to something that uses reflexion?
 */

export function assertIsDefinedUnsafe<T>(v: T | null | undefined | unknown, msg: string): asserts v is NonNullable<T> {
  if (v === null || v === undefined || Number.isNaN(v)) {
    throw new Error(msg);
  }
}

export function assert(v: boolean, msg: string) {
  if (!v) {
    throw new Error(msg);
  }
}

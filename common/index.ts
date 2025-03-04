export type Result<T> = {
  error: false
  result: T
} | {
  error: true
  message: string
};
export type ResponseSuccess<T> = Extract<Result<T>, { error: false }>;
export type ResponseError<T> = Extract<Result<T>, { error: true }>;

export type * from './autocomplete';
export type * from './files';
export type * from './auth';
export type * from './translate';
export type * from './chat';
export type * from './blockchain';
export type * from './tracking';
export type * from './metadata';
export * from './metadata';
export * from './utils';
export * from './user';

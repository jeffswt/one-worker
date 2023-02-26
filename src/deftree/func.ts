/**
 * Converts a synchronous function into its asynchronous counterpart.
 *
 * @internal
 */
export type DefTreeAcceptableFunction<T> = T extends (
  ...args: infer Args
) => infer ReturnType
  ? (...args: Args) => Promise<ReturnType>
  : never;

/** @internal {@link DefTreeAcceptableFunction} */
export type IsDefTreeAcceptableFunction<T> = T extends (
  ...args: infer Args
) => infer ReturnType
  ? true
  : false;

/**
 * Accepts an asynchronous function.
 *
 * @internal
 */
export type DefTreeAcceptableAsyncFunction<T> = T extends (
  ...args: infer Args
) => Promise<infer ReturnType>
  ? T
  : never;

/** @internal {@link DefTreeAcceptableAsyncFunction} */
export type IsDefTreeAcceptableAsyncFunction<T> = T extends (
  ...args: infer Args
) => Promise<infer ReturnType>
  ? true
  : false;

/**
 * Converts a synchronous generator function into its asynchronous counterpart.
 *
 * @internal
 */
export type DefTreeAcceptableGenerator<T> = T extends (
  ...args: infer Args
) => Generator<infer YieldType, infer ReturnType>
  ? (...args: Args) => AsyncGenerator<YieldType, ReturnType>
  : never;

/** @internal {@link DefTreeAcceptableGenerator} */
export type IsDefTreeAcceptableGenerator<T> = T extends (
  ...args: infer Args
) => Generator<infer YieldType, infer ReturnType>
  ? true
  : false;

/**
 * Accepts an asynchronous generator.
 *
 * @internal
 */
export type DefTreeAcceptableAsyncGenerator<T> = T extends (
  ...args: infer Args
) => AsyncGenerator<infer YieldType, infer ReturnType>
  ? T
  : never;

/** @internal {@link DefTreeAcceptableAsyncGenerator} */
export type IsDefTreeAcceptableAsyncGenerator<T> = T extends (
  ...args: infer Args
) => AsyncGenerator<infer YieldType, infer ReturnType>
  ? true
  : false;

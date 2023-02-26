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

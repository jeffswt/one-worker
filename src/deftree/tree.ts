import { DefTreeAcceptableClass, IsDefTreeAcceptableClass } from "./class";
import {
  DefTreeAcceptableAsyncFunction,
  DefTreeAcceptableAsyncGenerator,
  DefTreeAcceptableFunction,
  DefTreeAcceptableGenerator,
  IsDefTreeAcceptableAsyncFunction,
  IsDefTreeAcceptableAsyncGenerator,
  IsDefTreeAcceptableFunction,
  IsDefTreeAcceptableGenerator,
} from "./func";

/**
 * Recursively converts a 'ability tree' definition into one that fully
 * supports asynchronous calls. In-adept leaf nodes will be forcefully replaced
 * with the {@link Never} type. With this annotation compile-time checks can be
 * made visible to the user with a TypeScript error shown on the original
 * object, when type inference tricks are applied.
 *
 * The tree will be recursively locked as read-only to prevent any reckless
 * modifications (which will cause undefined behavior).
 *
 * @internal
 */
export type DefTreeAcceptableTree<T> =
  IsDefTreeAcceptableAsyncFunction<T> extends true
    ? DefTreeAcceptableAsyncFunction<T>
    : IsDefTreeAcceptableAsyncGenerator<T> extends true
    ? DefTreeAcceptableAsyncGenerator<T>
    : IsDefTreeAcceptableGenerator<T> extends true
    ? DefTreeAcceptableGenerator<T>
    : IsDefTreeAcceptableFunction<T> extends true
    ? DefTreeAcceptableFunction<T>
    : IsDefTreeAcceptableClass<T> extends true
    ? DefTreeAcceptableClass<T>
    : T extends Record<string, any>
    ? {
        [key in keyof T]: DefTreeAcceptableTree<T[key]>;
      }
    : never;

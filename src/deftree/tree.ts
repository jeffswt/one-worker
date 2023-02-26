import { DefTreeAcceptableClass } from "./class";
import {
  DefTreeAcceptableAsyncFunction,
  DefTreeAcceptableAsyncGenerator,
  DefTreeAcceptableGenerator,
  DefTreeAcceptableFunction,
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
  DefTreeAcceptableAsyncFunction<T> extends never
    ? DefTreeAcceptableAsyncGenerator<T> extends never
      ? DefTreeAcceptableGenerator<T> extends never
        ? DefTreeAcceptableFunction<T> extends never
          ? DefTreeAcceptableClass<T> extends never
            ? T extends Record<string, any>
              ? {
                  [key in keyof T]: DefTreeAcceptableTree<T[key]>;
                }
              : never
            : DefTreeAcceptableClass<T>
          : DefTreeAcceptableFunction<T>
        : DefTreeAcceptableGenerator<T>
      : DefTreeAcceptableAsyncGenerator<T>
    : DefTreeAcceptableAsyncFunction<T>;

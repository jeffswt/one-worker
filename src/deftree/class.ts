import {
  DefTreeAcceptableAsyncFunction,
  DefTreeAcceptableAsyncGenerator,
  DefTreeAcceptableFunction,
  DefTreeAcceptableGenerator,
} from "./func";

/**
 * Converts a class definition (i.e. the one defined with a constructor) to its
 * proxy-able counterpart. The conversion should follow these rules:
 *
 *  - All publicly accessible property keys must be strings (symbols cannot be
 *    used since they are not 'Structured-clone'-able).
 *  - If a property of this instance is a method, it will be converted to the
 *    proper 'proxy-able' counterpart.
 *  - When all properties are asynchronous methods and does not require a
 *    conversion, the original instance type will be preserved. Otherwise, a
 *    new type with a similar structure and fields preserved on a best-effort
 *    basis would be created.
 *  - Should any property be a non-function (either async or not), the entire
 *    conversion will fallback to `never`, indicating an error. This will not
 *    however impede the runtime evaluations, but instead warns you that these
 *    properties should be set as private and exposed with asynchronous getter
 *    or setter methods.
 *
 * @internal
 */
export type DefTreeAcceptableClass<T> = T extends {
  new (...args: infer Args): infer Instance;
}
  ? CreateClass<T, Args, Instance, DefTreeAcceptableInstance<Instance>>
  : T extends { prototype: infer Instance }
  ? CreateClass<T, never, Instance, DefTreeAcceptableInstance<Instance>>
  : never;

/** @internal Compose new constructor and use the original when possible. */
type CreateClass<
  Class,
  ConstructorArgs extends unknown[],
  Instance,
  Converted
> = Instance extends Converted
  ? Converted extends Instance
    ? Class
    : CreateClassWith<ConstructorArgs, Converted>
  : CreateClassWith<ConstructorArgs, Converted>;

type CreateClassWith<
  ConstructorArgs extends unknown[],
  Converted
> = Converted extends never
  ? // we reject those invalid instances
    never
  : { new (...args: ConstructorArgs): Converted };

/**
 * Converts a class instance to its proxy-able counterpart.
 */
export type DefTreeAcceptableInstance<T> = T extends { [key: string]: any }
  ? ConvertFields<T> extends infer Converted
    ? // drop classes that have invalid fields
      true extends HasNever<Converted>
      ? never
      : // use converted ver. for those have altered fields
      true extends HasInequality<T, Converted>
      ? Converted
      : // the class is already acceptable, do not alter anything
        T
    : never
  : never;

/** @internal If invalid conversion is occurring to any of its properties. */
type HasNever<T> = ValueOf<{
  [key in keyof T]: [T[key]] extends [never] ? true : false;
}>;

/** @internal If there are mismatches between the two types' properties. */
type HasInequality<A, B> = ValueOf<{
  [key in keyof A]: key extends keyof B
    ? A[key] extends B[key]
      ? B[key] extends A[key]
        ? false
        : true
      : true
    : true;
}>;

/** @internal Batch convert object properties. */
type ConvertFields<T> = {
  [key in keyof T]: ConvertField<T[key]>;
};

/** @internal Convert object property in a specific order. */
type ConvertField<T> = DefTreeAcceptableAsyncFunction<T> extends never
  ? DefTreeAcceptableAsyncGenerator<T> extends never
    ? DefTreeAcceptableGenerator<T> extends never
      ? DefTreeAcceptableFunction<T> extends never
        ? never
        : DefTreeAcceptableFunction<T>
      : DefTreeAcceptableGenerator<T>
    : DefTreeAcceptableAsyncGenerator<T>
  : DefTreeAcceptableAsyncFunction<T>;

type ValueOf<T> = T[keyof T];

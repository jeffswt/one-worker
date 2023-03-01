export type Result<T, E> =
  | {
      ok: true;
      val: T;
      err?: never;
    }
  | {
      ok: false;
      val?: never;
      err: E;
    };

export function Ok<T, E>(val: T): Result<T, E> {
  return {
    ok: true,
    val: val,
  };
}

export function Err<T, E>(err: E): Result<T, E> {
  return {
    ok: false,
    err: err,
  };
}

/**
 * The {@link Option} type is borrowed from Rust, since `undefined` alone is
 * not capable of expressing an `undefined` type's nullability.
 */
export type Option<T> =
  | {
      has: false;
      val?: never;
    }
  | {
      has: true;
      val: T;
    };

export function None<T>(): Option<T> {
  return {
    has: false,
  };
}

export function Some<T>(val: T): Option<T> {
  return {
    has: true,
    val: val,
  };
}

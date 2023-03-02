// some aliases for readability (matters!)
type ObjectID = string;
type TransactionID = string;

/** @internal Protocol request message type. */
export type NetworkRequestMessage =
  | ConstructRequest
  | InvokeRequest
  | YieldFromRequest
  | DropRequest;

/** @internal Protocol request message type switch. */
export enum NetworkRequestMessageType {
  Construct = 0x010101,
  Invoke = 0x010201,
  YieldFrom = 0x010301,
  Drop = 0x010401,
}

type ConstructRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.Construct;

  /**
   * Root of the target constructor call. It may be an object stored in a
   * directory -- represented with the object identifier, or the one-and-only
   * definition tree represented by a `null`.
   *
   * This root may be further traversed with the path {@link p}.
   */
  r: ObjectID | null;

  /**
   * Indicating whether we wish to traverse to an in-depth child of the object
   * {@link r}. For example, having {@link p} set to `['x', 'y', 'z']` would
   * eventually interact with `objects[r].x.y.z`. Having an empty list assigned
   * to {@link p} will interact directly with the root object.
   */
  p: string[];

  /**
   * Constructor arguments.
   */
  a: any[];
};

type InvokeRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.Invoke;

  /**
   * Root of the target constructor call. For details, see
   * {@link ConstructRequest.r}.
   */
  r: ObjectID | null;

  /**
   * Descendant traversal path for the root object. For details, see
   * {@link ConstructRequest.p}.
   */
  p: string[];

  /**
   * The target object would be invoked with these arguments.
   */
  a: any[];
};

type YieldFromRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.YieldFrom;

  /**
   * Identifier to the generator object. This value is produced by the first
   * and only {@link YieldReadyResponse.f}.
   */
  r: ObjectID;
};

type DropRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.Drop;

  /**
   * The target object to be dropped. This must be a specific object identifier
   * and may never be the definition tree (being constant).
   */
  r: ObjectID;
};

/** @internal Protocol response message type. */
export type NetworkResponseMessage =
  | ConstructOKResponse
  | ConstructFailResponse
  | InvokeResolveResponse
  | InvokeRejectResponse
  | YieldReadyResponse
  | YieldNextResponse
  | YieldFinishResponse
  | YieldThrowResponse
  | DropOKResponse;

/** @internal Protocol response message type switch. */
export enum NetworkResponseMessageType {
  ConstructOK = 0x020101,
  ConstructFail = 0x020102,

  InvokeResolve = 0x020201,
  InvokeReject = 0x020202,

  YieldReady = 0x020301,
  YieldNext = 0x020302,
  YieldFinish = 0x020303,
  YieldThrow = 0x020304,

  DropOK = 0x020401,
}

type ConstructOKResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.ConstructOK;

  /**
   * The action finished with the constructed object assigned with this
   * identifier.
   */
  f: ObjectID;
};

type ConstructFailResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.ConstructFail;

  /**
   * An exception was thrown during the constructor call.
   */
  e: Error;
};

type InvokeResolveResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.InvokeResolve;

  /**
   * The call turned out to be invoked upon a typical function or an
   * asynchronous function. This field stores results of that successful call.
   */
  f: any;
};

type InvokeRejectResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.InvokeReject;

  /**
   * The call turned out to be invoked upon a typical function or an
   * asynchronous function. This field stores the exception during an
   * unsuccessful call.
   */
  e: Error;
};

type YieldReadyResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.YieldReady;

  /**
   * The call turned out to be invoked upon a generator function or an
   * asynchronous generator function. The generator has been created and awaits
   * further 'next' requests.
   *
   * This is the object ID to the generator, and all subsequent
   * {@link YieldFromRequest}s must use this identifier.
   *
   * The generator will be dropped either after a {@link YieldFinishResponse}
   * or a {@link YieldThrowResponse}, or when a manual drop was initiated.
   */
  f: ObjectID;
};

type YieldNextResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.YieldNext;

  /**
   * The generator had produced these values but had not yet finished. This
   * corresponds to the {@link IteratorResult} interface where `done` is set to
   * false.
   */
  f: any;
};

type YieldFinishResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.YieldFinish;

  /**
   * The generator had successfully completed its entire execution and this
   * field stored its final results. This corresponds to the
   * {@link IteratorResult} interface where `done` is set to false.
   *
   * The generator will be discarded from the directory ('dropped')
   * automatically afterwards.
   */
  f: any;
};

type YieldThrowResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.YieldThrow;

  /**
   * The generator had encountered an error and needs to stop. This field
   * stored the very exception.
   *
   * The generator will be discarded from the directory ('dropped')
   * automatically afterwards.
   */
  e: Error;
};

/**
 * The drop is always successful regardless of whether the object actually
 * exists.
 */
type DropOKResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.DropOK;
};

import { UUID } from "../util/uuid";

/** @internal Identifies a worker ('server'). */
export type ServerID = number;

/**
 * @internal Groups messages into a set or stream belonging to a bidirectional
 *           transaction.
 */
export type TransactionID = UUID;

/**
 * @internal Identifier of a JavaScript object that cannot be structured
 *           cloned. Any object shall exist in exactly one object directory in
 *           its source of worker, where other instances having this ID are
 *           actually shadows of the source object which directs requests
 *           through a proxy.
 */
export type ObjectID = UUID;

/** @internal Protocol request message type. */
export type NetworkRequestMessage =
  | ConstructRequest
  | InvokeRequest
  | PromiseThenRequest
  | GeneratorNextRequest
  | GeneratorReturnRequest
  | GeneratorThrowRequest
  | RefBroadcastRequest;

/** @internal Protocol request message type switch. */
export enum NetworkRequestMessageType {
  Construct = 0x010101,
  Invoke = 0x010201,
  PromiseThen = 0x010301,
  GeneratorNext = 0x010401,
  GeneratorReturn = 0x010402,
  GeneratorThrow = 0x010403,
  RefBroadcast = 0x010501,
}

type ConstructRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.Construct;

  /**
   * Calling a constructor on this object. This **must** be an existent class
   * prototype stored in one of the object directories.
   *
   * Since a constructor is always called with `this` bound to the newly
   * created object, `this` is not included in this constructor call.
   */
  r: ObjectID;

  /**
   * Constructor arguments, if any.
   */
  a: any[];
};

type InvokeRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.Invoke;

  /**
   * The function invocation is calling this function object. It should be
   * either an asynchronous function or an asynchronous generator (while
   * synchronous ones may also be supported, they are actually banned by the
   * type system), whilst could also be either a unbound one, an async member
   * method of a class instance, or just a function as a property of any
   * arbitrary object.
   */
  r: ObjectID;

  /**
   * The function call is bound to `this` object. Relate to {@link ObjectID}'s
   * documentation on the nullish value, when the call is not bound to any
   * object.
   *
   * @see {Function.prototype.bind}
   */
  o: ObjectID;

  /**
   * The target object would be invoked with these arguments.
   */
  a: any[];
};

type PromiseThenRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.PromiseThen;

  /**
   * Calling `await` on this promise object. It shall be an existent promise
   * object stored in one of the object directories, and more often be one
   * created by {@link InvokeRequest}.
   */
  r: ObjectID;
};

type GeneratorNextRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.GeneratorNext;

  /**
   * Calling {@link AsyncGenerator.prototype.next} on this generator object.
   * The object shall be an existent generator object stored in one of the
   * object directories, and more often be created by {@link InvokeRequest}.
   */
  r: ObjectID;
};

type GeneratorReturnRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.GeneratorReturn;

  /** @see {@link GeneratorNextRequest.r}. */
  r: ObjectID;

  /** To enforce a return value on the async generator, interrupting it. */
  a: any;
};

type GeneratorThrowRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.GeneratorThrow;

  /** @see {@link GeneratorNextRequest.r}. */
  r: ObjectID;

  /** To forcefully throw exception on the async generator, interrupting it. */
  e: Error;
};

type RefBroadcastRequest = {
  i: TransactionID;
  /**
   * The reference broadcast event must be issued by the master server since it
   * handles all the routing of messages.
   */
  t: NetworkRequestMessageType.RefBroadcast;

  /**
   * Announces that these known objects are updated with a new reference count.
   * By defining reference count we mean that this many workers are tracking
   * this object.
   *
   * Any object has at most 1 reference on any server.
   */
  rs: { [id: ObjectID]: number };
};

/** @internal Protocol response message type. */
export type NetworkResponseMessage =
  | ConstructOKResponse
  | ConstructFailResponse
  | InvokeOKResponse
  | InvokeFailResponse
  | PromiseResolveResponse
  | PromiseRejectResponse
  | GeneratorNextResponse
  | GeneratorFinishResponse
  | GeneratorThrowResponse
  | RefReplyResponse;

/** @internal Protocol response message type switch. */
export enum NetworkResponseMessageType {
  ConstructOK = 0x020101,
  ConstructFail = 0x020102,

  InvokeOK = 0x020201,
  InvokeFail = 0x020202,

  PromiseResolve = 0x020301,
  PromiseReject = 0x020302,

  GeneratorNext = 0x020401,
  GeneratorFinish = 0x020402,
  GeneratorThrow = 0x020403,

  RefReply = 0x020501,
}

type ConstructOKResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.ConstructOK;

  /**
   * The action finished with the constructed object assigned with this
   * identifier.
   *
   * The constructed object is never structured-cloneable, and therefore be
   * represented with an identifier.
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

type InvokeOKResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.InvokeOK;

  /**
   * The call turned out to be invoked upon an asynchronous function or an
   * asynchronous generator function. The result is either a `Promise` or an
   * `AsyncGenerator`, and that neither of them is structured-cloneable. They
   * therefore are represented by an identifier.
   */
  f: ObjectID;
};

type InvokeFailResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.InvokeFail;

  /**
   * The call on that function turned out to be unsuccessful. The field stores
   * the exception.
   */
  e: Error;
};

type PromiseResolveResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.PromiseResolve;

  /**
   * The `.then()` call on the promise object turned out to be successful. Here
   * stores the final result of the promise object.
   */
  f: any;
};

type PromiseRejectResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.PromiseReject;

  /**
   * Retrieving final results from the promise object did not success and had
   * thrown an exception.
   */
  e: Error;
};

type GeneratorNextResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.GeneratorNext;

  /**
   * The generator had produced these values but had not yet finished. This
   * corresponds to the {@link IteratorResult} interface where `done` is set to
   * false.
   */
  f: any;
};

type GeneratorFinishResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.GeneratorFinish;

  /**
   * The generator had successfully completed its entire execution and this
   * field stored its final results. This corresponds to the
   * {@link IteratorResult} interface where `done` is set to true.
   *
   * The generator will be discarded from the directory ('dropped')
   * automatically afterwards (by the builtin GC).
   */
  f: any;
};

type GeneratorThrowResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.GeneratorThrow;

  /**
   * The generator had encountered an error and needs to stop. This field
   * stored the very exception.
   *
   * The generator will be discarded from the directory ('dropped')
   * automatically afterwards.
   */
  e: Error;
};

type RefReplyResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.RefReply;

  /**
   * Announces that references to these objects on this server instance are
   * altered by either adding a new reference (`true`) or dropping an existing
   * reference (`false`, garbage collected).
   */
  rs: { [id: ObjectID]: boolean };
};

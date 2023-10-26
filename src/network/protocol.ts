import { UUID } from "../util/uuid";

///////////////////////////////////////////////////////////////////////////////
//  shared types

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

///////////////////////////////////////////////////////////////////////////////
//  exposed interface

/**
 * Interact upon a 1-to-1 direct connection against another server. Each call
 * will invoke exactly 1 transaction.
 */
export interface INetworkRequestAgent {
  construct(
    req: ConstructRequest
  ): Promise<ConstructOKResponse | ConstructFailResponse>;
  invoke(req: InvokeRequest): Promise<InvokeOKResponse | InvokeFailResponse>;
  promiseThen(
    req: PromiseThenRequest
  ): Promise<PromiseResolveResponse | PromiseRejectResponse>;
  generatorNext(
    req: GeneratorNextRequest
  ): Promise<
    GeneratorNextResponse | GeneratorFinishResponse | GeneratorThrowResponse
  >;
  generatorReturn(req: GeneratorReturnRequest): Promise<void>;
  generatorThrow(req: GeneratorThrowRequest): Promise<void>;
  refBroadcast(req: RefBroadcastRequest): Promise<RefReplyResponse>;
}

/**
 * Passively listen to incoming transactions from other servers. Each call will
 * be replied with exactly 1 result or 1 stream depending on the situation.
 */
export interface INetworkResponseAgent {
  onConstruct(
    res: ConstructRequest
  ): Promise<ConstructOKResponse | ConstructFailResponse>;
  onInvoke(res: InvokeRequest): Promise<InvokeOKResponse | InvokeFailResponse>;
  onPromiseThen(
    res: PromiseThenRequest
  ): Promise<PromiseResolveResponse | PromiseRejectResponse>;
  onGeneratorNext(
    res: GeneratorNextRequest
  ): Promise<
    GeneratorNextResponse | GeneratorFinishResponse | GeneratorThrowResponse
  >;
  onGeneratorReturn(res: GeneratorReturnRequest): Promise<void>;
  onGeneratorThrow(res: GeneratorThrowRequest): Promise<void>;
  onRefBroadcast(res: RefBroadcastRequest): Promise<RefReplyResponse>;
}

///////////////////////////////////////////////////////////////////////////////
//  request stage

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

export type ConstructRequest = {
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

export type InvokeRequest = {
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

export type PromiseThenRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.PromiseThen;

  /**
   * Calling `await` on this promise object. It shall be an existent promise
   * object stored in one of the object directories, and more often be one
   * created by {@link InvokeRequest}.
   */
  r: ObjectID;
};

export type GeneratorNextRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.GeneratorNext;

  /**
   * Calling {@link AsyncGenerator.prototype.next} on this generator object.
   * The object shall be an existent generator object stored in one of the
   * object directories, and more often be created by {@link InvokeRequest}.
   */
  r: ObjectID;
};

export type GeneratorReturnRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.GeneratorReturn;

  /** @see {@link GeneratorNextRequest.r}. */
  r: ObjectID;

  /** To enforce a return value on the async generator, interrupting it. */
  a: any;
};

export type GeneratorThrowRequest = {
  i: TransactionID;
  t: NetworkRequestMessageType.GeneratorThrow;

  /** @see {@link GeneratorNextRequest.r}. */
  r: ObjectID;

  /** To forcefully throw exception on the async generator, interrupting it. */
  e: Error;
};

export type RefBroadcastRequest = {
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

///////////////////////////////////////////////////////////////////////////////
//  response stage

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

export type ConstructOKResponse = {
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

export type ConstructFailResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.ConstructFail;

  /**
   * An exception was thrown during the constructor call.
   */
  e: Error;
};

export type InvokeOKResponse = {
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

export type InvokeFailResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.InvokeFail;

  /**
   * The call on that function turned out to be unsuccessful. The field stores
   * the exception.
   */
  e: Error;
};

export type PromiseResolveResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.PromiseResolve;

  /**
   * The `.then()` call on the promise object turned out to be successful. Here
   * stores the final result of the promise object.
   */
  f: any;
};

export type PromiseRejectResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.PromiseReject;

  /**
   * Retrieving final results from the promise object did not success and had
   * thrown an exception.
   */
  e: Error;
};

export type GeneratorNextResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.GeneratorNext;

  /**
   * The generator had produced these values but had not yet finished. This
   * corresponds to the {@link IteratorResult} interface where `done` is set to
   * false.
   */
  f: any;
};

export type GeneratorFinishResponse = {
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

export type GeneratorThrowResponse = {
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

export type RefReplyResponse = {
  i: TransactionID;
  t: NetworkResponseMessageType.RefReply;

  /**
   * Announces that references to these objects on this server instance are
   * altered by either adding a new reference (`true`) or dropping an existing
   * reference (`false`, garbage collected).
   */
  rs: { [id: ObjectID]: boolean };
};

import {
  INetworkRequestAgent,
  INetworkResponseAgent,
  NetworkRequestMessageType,
  NetworkResponseMessageType,
  newTransactionID,
  ObjectID,
} from "../network/protocol";
import { createUniqueId } from "../util/crypto";
import { IWeakObjectStore } from "./objstore";
import { createShadow, IShadow } from "./shadow";

/**
 * An object host combines the object store and various methods. It contains
 * stored objects which may be RMI-ed over the network, and that it provides a
 * uniform interface for method invocation.
 *
 * @see {@link INetworkResponseAgent}
 */
export interface IWeakObjectHost {
  /**
   * Construct object. Returns shadow immediately, with all member methods
   * invocable. However, none of these methods will fire request packets until
   * the response packet from the construct request is received.
   */
  construct(self: ObjectID, args: any[]): IShadow;

  /**
   * Using a 'call function' on an existing object. The shadow is returned
   * immediately but the behaviour is the same as {@link construct}.
   */
  invoke(self: ObjectID, bind: ObjectID, args: any[]): IShadow;

  /** Using `await` on a `Promise` shadow. */
  promiseThen(self: ObjectID): Promise<any | never>;

  /** Using `.next()` on an `AsyncIterable` shadow. */
  generatorNext(self: ObjectID): Promise<IteratorResult<any, any> | never>;

  /** Force a return value on an `AsyncIterable` shadow. */
  generatorReturn(
    self: ObjectID,
    returns: any
  ): Promise<IteratorResult<any, any>>;

  /** Force an error on an `AsyncIterable` shadow. */
  generatorThrow(self: ObjectID, error: any): Promise<IteratorResult<any, any>>;
}

export class WeakObjectHost implements IWeakObjectHost {
  /** Communicate with the external channel. */
  private readonly _channel: INetworkRequestAgent;
  /** Stores shadow handles to remote objects. */
  private readonly _weakStore: IWeakObjectStore;

  constructor(channel: INetworkRequestAgent, weakStore: IWeakObjectStore) {
    this._channel = channel;
    this._weakStore = weakStore;
  }

  construct(self: ObjectID, args: any[]): IShadow {
    // create deferred handle
    const objId = createUniqueId();
    const handle = this._weakStore.insert(objId);
    // TODO: what if [self] is already deferred?

    // initialize object, but defer all further accesses
    return createShadow(this, handle, async () => {
      const r = await this._channel.construct({
        i: newTransactionID(),
        t: NetworkRequestMessageType.Construct,
        r: self,
        a: args,
      });
    });
  }

  invoke(self: ObjectID, bind: ObjectID, args: any[]): IShadow {
    // create deferred handle
    const objId = createUniqueId();
    const handle = this._weakStore.insert(objId);
    // TODO: what if [self] is already deferred?

    return createShadow(this, handle, async () => {
      const r = await this._channel.invoke({
        i: newTransactionID(),
        t: NetworkRequestMessageType.Invoke,
        r: self,
        o: bind,
        a: args,
      });
    });
  }

  async promiseThen(self: ObjectID): Promise<any | never> {
    const r = await this._channel.promiseThen({
      i: newTransactionID(),
      t: NetworkRequestMessageType.PromiseThen,
      r: self,
    });
    if (r.t === NetworkResponseMessageType.PromiseReject) throw r.e;
    else return r.f;
  }

  async generatorNext(
    self: ObjectID
  ): Promise<IteratorResult<any, any> | never> {
    const r = await this._channel.generatorNext({
      i: newTransactionID(),
      t: NetworkRequestMessageType.GeneratorNext,
      r: self,
    });
    if (r.t === NetworkResponseMessageType.GeneratorThrow) throw r.e;
    else return { done: r.d, value: r.f };
  }

  async generatorReturn(
    self: ObjectID,
    returns: any
  ): Promise<IteratorResult<any, any>> {
    const r = await this._channel.generatorReturn({
      i: newTransactionID(),
      t: NetworkRequestMessageType.GeneratorReturn,
      r: self,
      a: returns,
    });
    return { done: r.d, value: r.f };
  }

  async generatorThrow(
    self: ObjectID,
    error: any
  ): Promise<IteratorResult<any, any>> {
    const r = await this._channel.generatorThrow({
      i: newTransactionID(),
      t: NetworkRequestMessageType.GeneratorThrow,
      r: self,
      e: error,
    });
    return { done: r.d, value: r.f };
  }
}

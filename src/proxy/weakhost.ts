import {
  INetworkRequestAgent,
  INetworkResponseAgent,
  NetworkRequestMessageType,
  NetworkResponseMessageType,
  newTransactionID,
  ObjectID,
} from "../network/protocol";
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
  generatorReturn(self: ObjectID, returns: any): Promise<void>;

  /** Force an error on an `AsyncIterable` shadow. */
  generatorThrow(self: ObjectID, error: any): Promise<void>;
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
    return createShadow(this, undefined, async (shadow) => {
      const r = await this._channel.construct({
        i: newTransactionID(),
        t: NetworkRequestMessageType.Construct,
        r: self,
        a: args,
      });
    });
  }

  invoke(self: ObjectID, bind: ObjectID, args: any[]): IShadow {
    return createShadow(this, undefined, async (shadow) => {
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
    else if (r.t === NetworkResponseMessageType.GeneratorFinish)
      return { done: true, value: r.f };
    else return { value: r.f };
  }

  async generatorReturn(self: ObjectID, returns: any): Promise<void> {
    await this._channel.generatorReturn({
      i: newTransactionID(),
      t: NetworkRequestMessageType.GeneratorReturn,
      r: self,
      a: returns,
    });
  }

  async generatorThrow(self: ObjectID, error: any): Promise<void> {
    await this._channel.generatorThrow({
      i: newTransactionID(),
      t: NetworkRequestMessageType.GeneratorThrow,
      r: self,
      e: error,
    });
  }
}

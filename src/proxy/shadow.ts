import { createUnionResult } from "./core";
import { IShadowHandle, ShadowHandleKey } from "./objstore";
import { IWeakObjectHost } from "./weakhost";

/**
 * All such objects are created by a {@link IWeakObjectHost}, such that a
 * shadow referencing a remote object on another object host unreachable via
 * general means. These values are commonly run on different workers, thus
 * their methods etc. can only be invoked via message channels.
 *
 * Any object that can be structured-clone'd on itself is not shadowed.
 *
 * There are methods in {@link IWeakObjectHost} that returns immediately, which
 * creates a 'deferred shadow'. The values cannot be guaranteed unless accessed
 * by an asynchronous interface, prima facie the `await` or `for await`
 * keywords or the `Promise` and `AsyncIterable` interfaces. The resolution of
 * deferred states will propagate through the invocation chain eventually.
 *
 * You may, however, pass shadows on to other object hosts before it is even
 * initialized (i.e. still in the deferred state). However, calling this object
 * at this time of its lifetime will incur two round trips, with this object
 * in the middle. In due course,
 */
export interface IShadow extends IShadowHandle {}

export function createShadow(
  weakHost: IWeakObjectHost,
  handle: IShadowHandle,
  deferredAction: () => Promise<void> | undefined
): IShadow {
  // TODO: create constructor

  // create promise, this is easy
  const shadowPromise = weakHost.promiseThen(handle[ShadowHandleKey].id);
  // we need to mock the 'next' method of this gen
  async function* shadowAsyncGenFunc(): AsyncGenerator<any, any> {
    while (true) {
      const next = await weakHost.generatorNext(handle[ShadowHandleKey].id);
      if (next.done) return next.value;
      yield next.value;
    }
  }
  // and ensure the methods are captured
  const shadowAsyncGen = shadowAsyncGenFunc();
  shadowAsyncGen.return = async (val: any | PromiseLike<any>) => {
    const id = handle[ShadowHandleKey].id;
    const syncVal = await val;
    const r = await weakHost.generatorReturn(id, syncVal);
    return { done: r.done, value: r.value };
  };
  shadowAsyncGen.throw = async (err: any) => {
    const id = handle[ShadowHandleKey].id;
    const r = await weakHost.generatorThrow(id, err);
    return { done: r.done, value: r.value };
  };

  // now fuse 'em together
  // TODO: id is shadowed
  const fused = createUnionResult(
    shadowPromise,
    shadowAsyncGen,
    (key) => handle[key as keyof IShadowHandle]
  );
  return fused as unknown as IShadow;
}

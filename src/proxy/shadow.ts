import { IWeakObjectHost } from "./objhost";
import { IShadowHandle } from "./objstore";

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
 */
export interface IShadow extends IShadowHandle {}

/** @private */
export interface ShadowImpl extends IShadow {}

export function createShadow(
  weakHost: IWeakObjectHost,
  handle: IShadowHandle | undefined,
  deferredAction: (self: ShadowImpl) => Promise<void> | undefined
): ShadowImpl {
  return handle!; // TODO
}

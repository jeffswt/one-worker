import { IWeakObjectHost } from "./weakhost";
import { IShadowHandle } from "./objstore";
import { AsyncNotifier } from "../async/notifier";

/** @internal @private */
export const ShadowKey = Symbol("ShadowImplKey");

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
export interface IShadow extends IShadowHandle {
  [ShadowKey]: {
    /** The object host that created this shadow. */
    h: IWeakObjectHost;

    /**
     * An asynchronous notifier telling deferred children to wake up after the
     * deferred initialization had completed. Having this field 'undefined'
     * means that this object is *not* deferred and you're safe to use its
     * object ID as well as other properties.
     */
    d?: AsyncNotifier<number> | undefined;
  };
}

export function createShadow(
  weakHost: IWeakObjectHost,
  handle: IShadowHandle,
  deferredAction: (self: ShadowImpl) => Promise<void> | undefined
): ShadowImpl {
  return handle!; // TODO
}

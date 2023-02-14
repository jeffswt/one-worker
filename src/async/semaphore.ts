export class AsyncSemaphore {
  /** Current resources available in this semaphore. */
  private _current: number;
  /** A waiting list of all callbacks pending for resources. */
  private _pending: Resolve[];

  constructor(initial: number) {
    // validate values so that they don't exceed the assumptions
    if (initial < 0)
      throw TypeError(`initial resources cannot be sub-zero: ${initial}`);
    // assign values to current status
    this._current = initial;
    this._pending = [];
  }

  /**
   * Requests a resource from the semaphore. Current user thread (async) will
   * be blocked by this semaphore if no more resources are available, until
   * another user thread releases a resource with {@link signal} and that no
   * other callers are pending for {@link wait}.
   *
   * @note Decrements the value of semaphore variable by 1. This is also known
   *       as the *P* primitive.
   */
  async wait(): Promise<void> {
    // single-threaded js guarantees atomicity
    if (this._current >= 1) {
      this._current -= 1;
      return;
    }
    // need continuation from signal caller
    return new Promise((resolve) => this._pending.push(resolve));
  }

  /**
   * Releases an available resource into the semaphore. If other user threads
   * are {@link wait}ing for this resource, this operation will release exactly
   * 1 pending user thread.
   *
   * @note Increments the value of semaphore variable by 1, this is also known
   *       as the *V* primitive.
   */
  async signal(): Promise<void> {
    if (this._pending.length > 0) {
      const resolve = this._pending.shift()!;
      resolve();
    } else {
      this._current += 1;
    }
    return;
  }

  /**
   * Similar to {@link signal}, but this one executes exactly {@link count}
   * times of the *V* primitive, and can save time when {@link count} is
   * excessively large compared to the number {@link wait}ing user threads.
   *
   * @param count Number of times to call {@link signal} in a row.
   */
  async signalMany(count: number): Promise<void> {
    for (; count > 0; count--) {
      // early leave because there's no more pending tasks
      if (this._pending.length <= 0) {
        this._current += count;
        break;
      }
      // still have to take the signal path
      const resolve = this._pending.shift()!;
      resolve();
    }
    return;
  }

  /**
   * Similar to {@link signal}, but releases all pending user threads on
   * {@link wait}. The semaphore is then set to a sufficiently large value
   * after these user threads are released.
   */
  async free(): Promise<void> {
    while (this._pending.length > 0) {
      const resolve = this._pending.shift()!;
      resolve();
    }
    const infinity = 1073741823;
    this._current += infinity;
  }
}

type Resolve = (value: void | PromiseLike<void>) => void;

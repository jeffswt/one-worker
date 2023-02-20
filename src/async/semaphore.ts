/**
 * Implementation for a robust, asynchronous semaphore. The semaphore could be
 * provided with an optional {@link capacity}, without which {@link signal}
 * calls won't be blocked.
 *
 * @link https://en.wikipedia.org/wiki/Semaphore_(programming)
 */
export class AsyncSemaphore {
  /** Current resources available in this semaphore. */
  private _current: number;
  /** Maximum allowed resources in this semaphore. */
  private _capacity: number | undefined;
  /** A waiting list of all {@link wait} callbacks pending for resources. */
  private _pendingWait: Resolve[];
  /** A waiting list of all {@link signal} callbacks pending for release. */
  private _pendingSignal: Resolve[];

  constructor(initial: number, capacity?: number | undefined) {
    // validate values so that they don't exceed the assumptions
    if (capacity !== undefined && capacity < 0)
      throw TypeError(`semaphore capacity cannot be sub-zero: ${capacity}`);
    if (initial < 0)
      throw TypeError(`initial resources cannot be sub-zero: ${initial}`);
    if (capacity !== undefined && initial > capacity)
      throw TypeError(`too many initial resources: ${initial} > ${capacity}`);
    // assign values to current status
    this._current = initial;
    this._capacity = capacity;
    this._pendingWait = [];
    this._pendingSignal = [];
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
    return new Promise((resolve) => this._waitImpl(resolve));
  }

  /**
   * Attempt to request a resource from the semaphore. If no resource is
   * available at the moment (requires waiting), return `false`.
   *
   * @note Although it is always guaranteed that the return result reflects
   *       the resource acquisition status, it is not guaranteed that this
   *       function returns immediately.
   */
  async tryWait(): Promise<boolean> {
    if (this._current <= 0) {
      return false;
    }
    await this.wait();
    return true;
  }

  private _waitImpl(resolve: Resolve): void {
    // there be `signal`s waiting for limit uncap
    if (this._pendingSignal.length > 0) {
      const pending = this._pendingSignal.shift()!;
      pending();
      resolve();
      return;
    }
    // non-blocking situation
    if (this._current >= 1) {
      this._current -= 1;
      resolve();
      return;
    }
    // continuation must be unlocked by a signal
    this._pendingWait.push(resolve);
    return;
  }

  /**
   * Releases an available resource into the semaphore. Current user thread
   * (async) will be blocked by this semaphore if no more empty space are
   * available (i.e. semaphore value reaches capacity), until other user
   * threads consumes enough resources with {@link wait}.
   *
   * @note Increments the value of semaphore variable by 1, this is also known
   *       as the *V* primitive.
   */
  async signal(): Promise<void> {
    return new Promise((resolve) => this._signalImpl(resolve));
  }

  private _signalImpl(resolve: Resolve): void {
    // there be `wait`s pending for resources
    if (this._pendingWait.length > 0) {
      const pending = this._pendingWait.shift()!;
      pending();
      resolve();
      return;
    }
    // there's no reason to wait
    if (this._capacity === undefined || this._current + 1 <= this._capacity) {
      this._current += 1;
      resolve();
      return;
    }
    // continuation must be unlocked by a wait
    this._pendingSignal.push(resolve);
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
    while (count >= 1) {
      await this.signal();
      count -= 1;
      // dump all the rest if there's no waiting
      if (this._pendingWait.length <= 0) {
        let dump = count;
        if (this._capacity !== undefined)
          dump = Math.max(dump, this._capacity - this._current);
        this._current += dump;
        break;
      }
    }
    // when there's still remaining, we need to patiently wait for `wait`s
    for (; count > 0; count--) {
      await this.signal();
    }
    return;
  }

  /**
   * Similar to {@link signal}, but releases all pending user threads on
   * {@link wait}. The semaphore is then set to a sufficiently large value
   * (or the capacity if is capped) after these user threads are released.
   */
  async free(): Promise<void> {
    while (this._pendingWait.length > 0) {
      await this.signal();
    }
    const infinity = 1073741823;
    this._current = this._capacity ?? infinity;
  }
}

type Resolve = (value: void | PromiseLike<void>) => void;

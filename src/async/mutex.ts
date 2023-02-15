import { AsyncSemaphore } from "./semaphore";

/**
 * An asynchronous Mutex lock implementation. An initial 'locked' state may be
 * provided as an optional parameter during initialization.
 *
 * @default release The mutex is unlocked by default.
 * @link https://en.wikipedia.org/wiki/Lock_(computer_science)
 */
export class AsyncMutex {
  /** The internal semaphore implementation. */
  private _semaphore: AsyncSemaphore;

  constructor(locked?: boolean) {
    locked = locked ?? false;
    this._semaphore = new AsyncSemaphore(locked ? 0 : 1, 1);
  }

  /** Acquire exclusive access on this resource. */
  async acquire(): Promise<void> {
    return this._semaphore.wait();
  }

  /** Return exclusive access from this resource. */
  async release(): Promise<void> {
    return this._semaphore.signal();
  }
}

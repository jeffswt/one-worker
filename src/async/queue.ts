import { AsyncMutex } from "./mutex";
import { AsyncSemaphore } from "./semaphore";

export class AsyncQueue<T> {
  /** Semaphore listening on remaining resources that may be read. */
  private _remainItems: AsyncSemaphore;
  /** Semaphore listening on remaining spaces to enqueue items. */
  private _remainSpace: AsyncSemaphore | undefined;
  /** A mutex used to guard access to the internal queue. */
  private _accessLock: AsyncMutex;
  /** Stores content in the queue. You should not manually access this. */
  private _items: T[];
  /** Whether the queue had closed. */
  private _closed: boolean;

  constructor(capacity?: number | undefined) {
    // validate values so that they don't exceed the assumptions
    if (capacity !== undefined && capacity < 0)
      throw TypeError(`semaphore capacity cannot be sub-zero: ${capacity}`);
    // initialize values
    this._remainItems = new AsyncSemaphore(0, capacity);
    if (capacity !== undefined)
      this._remainSpace = new AsyncSemaphore(capacity, capacity);
    this._accessLock = new AsyncMutex();
    this._items = [];
    this._closed = false;
  }

  async push(item: T): Promise<void> {
    if (this._closed) return;
    if (this._remainSpace) await this._remainSpace.wait();
    if (this._closed) return;
    await this._accessLock.acquire();
    if (this._closed) return;
    this._items.push(item);
    await this._accessLock.release();
    if (this._closed) return;
    await this._remainItems.signal();
    return;
  }

  async pop(): Promise<T | undefined> {
    if (this._closed) return undefined;
    await this._remainItems.wait();
    if (this._closed) return undefined;
    await this._accessLock.acquire();
    if (this._closed) return undefined;
    const item = this._items.shift();
    await this._accessLock.release();
    if (this._closed) return undefined;
    if (this._remainSpace) await this._remainSpace.signal();
    if (this._closed) return undefined;
    return item;
  }

  async close(): Promise<void> {
    this._closed = true;
    await this._remainItems.free();
    if (this._remainSpace) await this._remainSpace.free();
    await this._accessLock.free();
  }
}

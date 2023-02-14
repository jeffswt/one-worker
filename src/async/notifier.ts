import { AsyncSemaphore } from "./semaphore";

/**
 * The asynchronous notifier implements a 1 sender to multiple subscribers
 * pattern. Its intended purpose is to guarantee that a `signal` would not
 * cause looping user threads calling `wait` to end up in a dead loop. **IT
 * DOES NOT**, however, guarantee that any message sent by `signal` was
 * received by any of the subscribers.
 *
 * The notifier simply swaps out the driver lying inside it to prevent new
 * `wait`ers to call that very same semaphore, effectively isolating the
 * previous signal against the next one.
 */
export class AsyncNotifier<T extends any = never> {
  /** All ongoing {@link wait} calls expect information from this driver. */
  driver: NotifierDriver<T>;

  constructor() {
    this.driver = {
      semaphore: new AsyncSemaphore(0),
      message: undefined,
    };
  }

  /**
   * Waits for a broadcasted message from the last {@link notify} call that
   * happened after this {@link wait} was called.
   *
   * @returns The message content.
   */
  async wait(): Promise<T> {
    const driver = this.driver;
    await this.driver.semaphore.wait();
    return driver.message!;
  }

  /**
   * Signals all currently {@link wait}ing callers with a shared reference to
   * a give {@link message}. If there are no subscribers {@link wait}ing, we
   * may treat this message as being discarded.
   *
   * @param message The to-be-broadcasted message content. Note that this value
   *        would be passed by reference so subscribers may alter it without
   *        premature notice.
   */
  async notify(message: T): Promise<void> {
    const currentDriver = this.driver;
    this.driver = {
      semaphore: new AsyncSemaphore(0),
      message: undefined,
    };
    currentDriver.message = message;
    await currentDriver.semaphore.free();
  }
}

interface NotifierDriver<T> {
  /** The underlying semaphore that drives the wait process. */
  semaphore: AsyncSemaphore;
  /** The message that is to be sent to the listeners. */
  message?: T;
}

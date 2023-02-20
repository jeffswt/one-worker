import { sleep } from "../src/async/time";

/**
 * Expects the given asynchronous method to timeout (commonly used as dead lock
 * detections).
 *
 * @example expectsTimeout(yourFunc).in(1000);
 */
export function expectsTimeout(func: () => Promise<void>): {
  in: (timeoutMs: number) => Promise<void>;
} {
  // defines how we catch the timeout
  const fulfilled = [undefined as boolean | undefined];
  async function taskRunner() {
    await func();
    if (fulfilled[0] === undefined) fulfilled[0] = true;
  }
  async function timeoutRunner(timeoutMs: number) {
    await sleep(timeoutMs / 1000);
    if (fulfilled[0] === undefined) fulfilled[0] = false;
  }

  // wrap it the timeout catcher in a jest-like interface
  // wrap up the timeout catchers
  async function raceRunner(timeoutMs: number) {
    const x = await Promise.race([taskRunner(), timeoutRunner(timeoutMs)]);
    expect(fulfilled[0]).toBe(false);
  }
  return {
    in: raceRunner,
  };
}

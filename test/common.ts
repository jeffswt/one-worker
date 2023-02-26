import { sleep } from "../src/async/time";

/**
 * Expects the given asynchronous method to timeout (commonly used as dead lock
 * detections).
 *
 * @example expectsTimeout(yourFunc).in(1000);
 * @internal
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

/**
 * Checks if two types are equivalent (or not) to each other.
 *
 * @param eq Expects them to be equal (`true`) or not (`false`).
 * @example expectTypesEq<number, number>();
 *          expectTypesEq<string, Date>(false);
 * @internal
 */
export function expectTypesEq<A = [never, 0], B = [never, 1]>(
  ...args: [A] extends [B] ? ([B] extends [A] ? [] : [eq: false]) : [eq: false]
): void {
  void args;
  return;
}

import { AsyncSemaphore } from "../../src/async/semaphore";
import { expectsTimeout } from "../common";

test("stress tons of pending waits", async () => {
  const lock = new AsyncSemaphore(0);
  for (let i = 0; i < 10000; i++) void lock.wait();
  for (let i = 0; i < 10000; i++) await lock.signal();
  await expectsTimeout(async () => {
    await lock.wait();
  }).in(100);
  await lock.signal();
  await lock.signal();
  await lock.wait();
});

test("stress tons of pending signals", async () => {
  const lock = new AsyncSemaphore(10000, 10000);
  for (let i = 0; i < 10000; i++) void lock.signal();
  for (let i = 0; i < 10000; i++) await lock.wait();
  await expectsTimeout(async () => {
    await lock.signal();
  }).in(100);
  await lock.wait();
  await lock.wait();
  await lock.signal();
});

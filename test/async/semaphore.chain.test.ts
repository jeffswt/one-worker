import { AsyncSemaphore } from "../../src/async/semaphore";
import { expectsTimeout } from "../common";

test("lock eventually released", async () => {
  const lock = new AsyncSemaphore(0);
  await expectsTimeout(async () => {
    await lock.wait();
  }).in(100);
  await lock.signal();
  await lock.signal();
  await lock.wait();
});

test("lock eventually released, but this one's bigger", async () => {
  const lock = new AsyncSemaphore(0);
  for (let i = 0; i < 10; i++)
    await expectsTimeout(async () => {
      await lock.wait();
    }).in(50);
  for (let i = 0; i < 10; i++) await lock.signal();
  await lock.signal();
  await lock.wait();
});

test("doing the 'release locks' from signals", async () => {
  const lock = new AsyncSemaphore(10, 10);
  await expectsTimeout(async () => {
    await lock.signal();
  }).in(100);
  await lock.wait();
  await lock.wait();
  await lock.signal();
});

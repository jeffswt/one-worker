import { AsyncSemaphore } from "../../src/async/semaphore";
import { expectsTimeout } from "../common";

test("try wait works", async () => {
  const lock = new AsyncSemaphore(0);
  expect(await lock.tryWait()).toBe(false);
  await lock.signal();
  expect(await lock.tryWait()).toBe(true);
  expect(await lock.tryWait()).toBe(false);
});

test("try signal works", async () => {
  const lock = new AsyncSemaphore(233, 233);
  expect(await lock.trySignal()).toBe(false);
  await lock.wait();
  expect(await lock.trySignal()).toBe(true);
  expect(await lock.trySignal()).toBe(false);
});

test("can signal many items at a time", async () => {
  const lock = new AsyncSemaphore(0);
  for (let i = 0; i < 9999; i++) void lock.wait();
  await expectsTimeout(async () => {
    await lock.wait();
  }).in(100);
  // here we have 10000 pending jobs
  await lock.signalMany(10000);
  await expectsTimeout(async () => {
    await lock.wait();
  }).in(100);
  await lock.signal();
  await lock.signal();
  await lock.wait();
});

test("signalMany does not incur extra performance", async () => {
  const lock = new AsyncSemaphore(0);
  for (let i = 0; i < 10000; i++) void lock.wait();
  await lock.signalMany(1073741823);
});

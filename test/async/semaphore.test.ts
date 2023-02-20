import { AsyncSemaphore } from "../../src/async/semaphore";
import { expectsTimeout } from "../common";

///////////////////////////////////////////////////////////////////////////////
//  just the start

test("bounded semaphore can be created", async () => {
  const lock = new AsyncSemaphore(0, 2);
  await lock.signal();
  await lock.wait();
});

test("unbounded semaphore can be created", async () => {
  const lock = new AsyncSemaphore(0);
  await lock.signal();
  await lock.wait();
});

///////////////////////////////////////////////////////////////////////////////
//  constructing simple dead locks

test("dead lock waiting semaphore when empty", async () => {
  const bounded = new AsyncSemaphore(0, 2333);
  await expectsTimeout(async () => {
    await bounded.wait();
  }).in(100);

  const unbounded = new AsyncSemaphore(0, 2333);
  await expectsTimeout(async () => {
    await unbounded.wait();
  }).in(100);
});

test("dead lock signaling bounded semaphore when filled", async () => {
  const bounded = new AsyncSemaphore(0, 233);
  for (let i = 0; i < 233; i++) await bounded.signal();
  expectsTimeout(async () => {
    await bounded.signal();
  }).in(100);
});

test("no dead lock signaling unbounded semaphore when filled", async () => {
  const bounded = new AsyncSemaphore(0);
  for (let i = 0; i < 2333; i++) await bounded.signal();
});

///////////////////////////////////////////////////////////////////////////////
//  we're going deeper

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

///////////////////////////////////////////////////////////////////////////////
//  stress test

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

///////////////////////////////////////////////////////////////////////////////
//  some extra functionalities

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

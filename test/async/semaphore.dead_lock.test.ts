import { AsyncSemaphore } from "../../src/async/semaphore";
import { expectsTimeout } from "../common";

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

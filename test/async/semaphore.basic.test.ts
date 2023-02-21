import { AsyncSemaphore } from "../../src/async/semaphore";

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

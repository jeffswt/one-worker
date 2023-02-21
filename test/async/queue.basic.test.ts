import { AsyncQueue } from "../../src/async/queue";
import { sleep } from "../../src/async/time";
import { expectsTimeout } from "../common";

test("queue works with capacity", async () => {
  const queue = new AsyncQueue<string>(3);
  await queue.push("a");
  await queue.push("bb");
  await queue.push("ccc");
  expect(await queue.pop()).toBe("a");
  expect(await queue.pop()).toBe("bb");
  expect(await queue.pop()).toBe("ccc");
  expectsTimeout(async () => {
    await queue.pop();
  }).in(100);
});

test("queue works without capacity", async () => {
  const queue = new AsyncQueue<string>();
  await queue.push("a");
  expect(await queue.pop()).toBe("a");
});

test("queue can be closed", async () => {
  const queue = new AsyncQueue<string>();
  const promiseA = queue.pop();
  const promiseB = queue.pop();
  const promiseC = queue.pop();
  await queue.push("a");
  await queue.push("bb");
  await sleep(0.001); // we need this
  await queue.close();

  expect(await promiseA).toBe("a");
  expect(await promiseB).toBe("bb");
  expect(await promiseC).toBe(undefined);
});

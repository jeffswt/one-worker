import { AsyncMutex } from "../../src/async/mutex";
import { expectsTimeout } from "../common";

test("mutex works", async () => {
  const lock = new AsyncMutex();
  await lock.acquire();
  await lock.release();
});

test("mutex can be initialized as locked", async () => {
  const lock = new AsyncMutex(true);
  await expectsTimeout(async () => {
    await lock.acquire();
  }).in(100);
});

test("mutex can only be acquired once", async () => {
  const lock = new AsyncMutex();
  await lock.acquire();
  await expectsTimeout(async () => {
    await lock.acquire();
  }).in(100);
  await lock.release();
  await lock.release();
  await lock.acquire();
});

test("mutex can only be released once", async () => {
  const lock = new AsyncMutex();
  await expectsTimeout(async () => {
    await lock.release();
  }).in(100);
});

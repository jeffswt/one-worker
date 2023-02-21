import { AsyncMutex } from "../../src/async/mutex";

test("many agents acquiring a loop of locks", async () => {
  const lock = new AsyncMutex();
  for (let i = 0; i < 10000; i++) void lock.acquire();
  for (let i = 0; i < 10000; i++) await lock.release();
  await lock.acquire();
});

test("loop acquire-release", async () => {
  const lock = new AsyncMutex();
  for (let i = 0; i < 10000; i++) {
    await lock.acquire();
    await lock.release();
  }
});

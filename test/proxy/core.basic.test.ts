import { sleep } from "../../src/async/time";
import { createUnionResult } from "../../src/proxy/core";

test("ensure merged object can be awaited", async () => {
  const merged = createUnionResult(
    promiseSample(false),
    genSample(false),
    () => undefined
  );
  expect(await merged).toBe(1);
});

test("ensure merged object can be used as async generator", async () => {
  const merged = createUnionResult(
    promiseSample(false),
    genSample(false),
    () => undefined
  );
  const items: number[] = [];
  for await (const item of merged) items.push(item);
  expect(items).toStrictEqual([0, 1, 2, 3, 4]);
});

async function promiseSample(shouldThrow: boolean) {
  await sleep(0.01);
  if (shouldThrow) throw Error("intended");
  return 1;
}

async function* genSample(shouldThrow: boolean) {
  for (let i = 0; i < 5; i++) {
    await sleep(0.01);
    yield i;
  }
  if (shouldThrow) throw Error("intended");
  return 233;
}

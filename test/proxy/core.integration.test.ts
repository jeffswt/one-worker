import { createUnionResult } from "../../src/proxy/core";
import { promiseSample, genSample } from "./core.common";

test("promise and async generators can run in isolation, though not recommended", async () => {
  const merged = createUnionResult(
    promiseSample(false),
    genSample(false),
    () => undefined
  );

  expect((await merged.next()).value).toBe(0);
  expect((await merged.next()).value).toBe(1);
  expect((await merged.next()).value).toBe(2);

  // they should be isolated against each other
  expect(await merged).toBe(1);

  const items = [];
  for await (const item of merged) items.push(item);
  expect(items).toStrictEqual([3, 4]);
});

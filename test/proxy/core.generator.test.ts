import { createUnionResult } from "../../src/proxy/core";
import { promiseSample, genSample } from "./core.common";

test("ensure merged async generators can be iterated", async () => {
  const merged = createUnionResult(
    promiseSample(false),
    genSample(false),
    () => undefined
  );
  const items: number[] = [];
  for await (const item of merged) items.push(item);
  expect(items).toStrictEqual([0, 1, 2, 3, 4]);
});

test("can catch on merged async generators", async () => {
  const merged = createUnionResult(
    promiseSample(false),
    genSample(true),
    () => undefined
  );
  await expect(async () => {
    for await (const item of merged) void item;
  }).rejects.toThrow();
});

test("next grammar works on merged async generators", async () => {
  const merged = createUnionResult(
    promiseSample(false),
    genSample(false),
    () => undefined
  );
  for (let i = 0; i < 5; i++)
    expect(await merged.next()).toStrictEqual({ done: false, value: i });
  expect(await merged.next()).toStrictEqual({ done: true, value: 233 });
});

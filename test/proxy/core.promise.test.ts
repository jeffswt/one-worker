import { createUnionResult } from "../../src/proxy/core";
import { promiseSample, genSample } from "./core.common";

test("ensure merged promises can be awaited", async () => {
  const merged = createUnionResult(
    promiseSample(false),
    genSample(false),
    () => undefined
  );
  expect(await merged).toBe(1);
});

test("ensure merged promises can be caught", async () => {
  const merged = createUnionResult(
    promiseSample(true),
    genSample(false),
    () => undefined
  );
  await expect(merged).rejects.toThrow();
});

test("then/catch/finally grammar works on merged promises", async () => {
  for (const shouldThrow of [true, false]) {
    const merged = createUnionResult(
      promiseSample(shouldThrow),
      genSample(false),
      () => undefined
    );
    let triggeredThen = [false];
    let triggeredCatch = [false];
    let triggeredFinally = [false];

    await merged
      .then((value) => {
        triggeredThen[0] = true;
        expect(value).toBe(1);
        return value * 2;
      })
      .then((value) => {
        triggeredThen[0] = true;
        expect(value).toBe(2);
      })
      .catch(() => {
        triggeredCatch[0] = true;
      })
      .finally(() => {
        triggeredFinally[0] = true;
      });
    expect(triggeredThen[0]).toBe(!shouldThrow);
    expect(triggeredCatch[0]).toBe(shouldThrow);
    expect(triggeredFinally[0]).toBe(true);
  }
});

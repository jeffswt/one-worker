import { sleep } from "../src/async/time";
import { expectsTimeout, expectTypesEq } from "./common";

test("detects expected timeout", async () => {
  await expectsTimeout(async () => {
    await sleep(0.15);
  }).in(100);
});

test("raises error on premature finish", async () => {
  try {
    await expectsTimeout(async () => {
      await sleep(0.05);
    }).in(100);
  } catch (err) {
    return;
  }
  expect(true).toBe("failed to detect non-timeout");
});

test("type equivalence check works", () => {
  expectTypesEq<number, number>();
  expectTypesEq<string, Date>(false);
  // @ts-expect-error(2345): types must be provided
  expectTypesEq();
});

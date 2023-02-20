import { sleep } from "../src/async/time";
import { expectsTimeout } from "./common";

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

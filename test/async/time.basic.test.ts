import { sleep } from "../../src/async/time";

test("sleep duration within margin of error", async () => {
  const errorMarginRatio = 0.05;
  const duration = 1.0;
  const begin = new Date();
  await sleep(duration);
  const end = new Date();
  const delta = (end.getTime() - begin.getTime()) / 1000;
  expect(delta).toBeGreaterThan(duration * (1 - errorMarginRatio));
  expect(delta).toBeLessThan(duration * (1 + errorMarginRatio));
});

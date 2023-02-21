import { AsyncNotifier } from "../../src/async/notifier";
import { expectsTimeout } from "../common";

test("notifier works", async () => {
  const notifier = new AsyncNotifier<number>();
  const promise = notifier.wait();
  await notifier.notify(233);
  expect(await promise).toBe(233);
});

test("notifier withholds un-notified events", async () => {
  const notifier = new AsyncNotifier<number>();
  await expectsTimeout(async () => {
    await notifier.wait();
  }).in(100);
});

test("all events are notified, at once", async () => {
  const notifier = new AsyncNotifier<number>();
  const promises = "?"
    .repeat(22)
    .split("")
    .map(() => notifier.wait());
  await notifier.notify(33);
  const result = await Promise.all(promises);
  expect(result.reduce((a, b) => a + b)).toBe(22 * 33);
});

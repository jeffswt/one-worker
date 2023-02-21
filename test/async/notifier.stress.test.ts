import { AsyncNotifier } from "../../src/async/notifier";

test("notifier can handle many agents", async () => {
  const notifier = new AsyncNotifier<number>();
  const promises = "?"
    .repeat(23333)
    .split("")
    .map(() => notifier.wait());
  await notifier.notify(1);
  const result = await Promise.all(promises);
  expect(result.reduce((a, b) => a + b)).toBe(23333);
});

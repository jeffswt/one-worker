import { AsyncNotifier } from "../../src/async/notifier";
import { sleep } from "../../src/async/time";
import { expectsTimeout } from "../common";

test("notifier can be reused with isolation", async () => {
  const notifier = new AsyncNotifier<number>();

  const firstBatch = "?"
    .repeat(1023)
    .split("")
    .map(() => notifier.wait());
  await notifier.notify(1);
  const firstResult = await Promise.all(firstBatch);
  expect(firstResult.reduce((a, b) => a + b)).toBe(1 * 1023);

  const secondBatch = "?"
    .repeat(256)
    .split("")
    .map(() => notifier.wait());
  await notifier.notify(1024);
  const secondResult = await Promise.all(secondBatch);
  expect(secondResult.reduce((a, b) => a + b)).toBe(1024 * 256);
});

test("isolation is perfectly guaranteed", async () => {
  const notifier = new AsyncNotifier<number>();
  const rounds = 11;
  const waitingAgents = 997;
  const notifyingAgents = 37;
  const frameTime = 0.001;

  for (let round = 0; round < rounds; round++) {
    const results: number[] = [];
    // some of the promises take data and record notified info to the queue
    const promiseBuilders = "?"
      .repeat(waitingAgents)
      .split("")
      .map(() => async () => {
        const frame = Math.floor(Math.random() * (notifyingAgents - 1));
        await sleep(frameTime * frame);
        results.push(await notifier.wait());
      });
    // and some of the promises provide input
    for (let i = 1; i < notifyingAgents; i++)
      promiseBuilders.push(async () => {
        // if you keep them all on one js frame, the resulting list would form
        // something like [3, 1, 0, 4, 2, 3, 1, 0, 4, 2, 3, ...], so we sleep
        await sleep(frameTime * i);
        await notifier.notify(i);
      });
    // shuffle them, and ensure there is one backing up
    promiseBuilders.sort(() => Math.random() - 0.5);
    promiseBuilders.push(async () => {
      await sleep(frameTime * notifyingAgents);
      await notifier.notify(notifyingAgents);
    });
    // run and see if there are any out-of-orders
    // it may end up like this: [1, 1, 3, 3, 3, 4, 4, 2, 2, 5, 5, 5]
    await Promise.all(promiseBuilders.map((builder) => builder()));
    for (let frame = 1; frame <= notifyingAgents; frame++) {
      let [first, end] = [-1, -1];
      for (let i = 0; i < results.length; i++)
        if (results[i] === frame) {
          if (first < 0) first = i;
          end = i;
        }
      const range = results.slice(first, end + 1);
      for (const item of range) expect(item).toBe(frame);
    }
  }
});

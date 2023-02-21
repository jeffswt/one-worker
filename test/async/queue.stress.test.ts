import { AsyncQueue } from "../../src/async/queue";

test("stressing queue with lots of pops", async () => {
  const agents = 5000;
  const queue = new AsyncQueue<number>();
  const promises: Promise<void>[] = [];
  const results: number[] = [];

  async function waitAgent() {
    const item = await queue.pop();
    results.push(item!);
  }
  for (let i = 0; i < agents; i++) promises.push(waitAgent());
  for (let i = 0; i < agents; i++) await queue.push(i);
  await Promise.all(promises);

  for (let i = 0; i < agents; i++) expect(results[i]).toBe(i);
});

test("stressing queue with lots of pushes", async () => {
  const agents = 5000;
  const queue = new AsyncQueue<number>();

  for (let i = 0; i < agents; i++) void queue.push(i);
  for (let i = 0; i < agents; i++) await queue.pop();
});

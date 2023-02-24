import { sleep } from "../../src/async/time";

export async function promiseSample(shouldThrow: boolean) {
  await sleep(0.01);
  if (shouldThrow) throw Error("intended");
  return 1;
}

export async function* genSample(shouldThrow: boolean) {
  for (let i = 0; i < 5; i++) {
    await sleep(0.01);
    yield i;
  }
  if (shouldThrow) throw Error("intended");
  return 233;
}

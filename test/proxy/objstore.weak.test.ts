import { sleep } from "../../src/async/time";
import {
  IWeakObjectStore,
  ShadowHandleKey,
  WeakObjectStore,
} from "../../src/proxy/objstore";
import { createUniqueId } from "../../src/util/crypto";

test("weak object stores can properly produce handles based on ids", async () => {
  const store: IWeakObjectStore = new WeakObjectStore();
  const id = createUniqueId();

  const nonExistentHandle = store.query(id);
  expect(nonExistentHandle).toBeUndefined();

  const handle = store.insert(id);
  expect(handle[ShadowHandleKey].id).toBe(id);

  const handle2 = store.query(id);
  expect(handle[ShadowHandleKey].id).toBe(id);

  expect(handle[ShadowHandleKey] === handle2![ShadowHandleKey]).toBe(true);
});

test("finalization registry works in this js runtime", async () => {
  let discarded = false;
  const fr: FinalizationRegistry<string> = new FinalizationRegistry((id) => {
    discarded = true;
  });

  fr.register({}, "nil");
  expect(discarded).toBe(false);

  let finished = false;
  allocateManyMemory(() => {
    return finished || discarded;
  });

  for (let i = 0; i < 30 && !discarded; i++) await sleep(0.1);
  finished = true;
  expect(discarded).toBe(true);
});

test("lifetime is correctly tracked in weak object stores", async () => {
  const store: IWeakObjectStore = new WeakObjectStore();
  const id = createUniqueId();

  function scope() {
    const handle = store.insert(id);
    expect(handle[ShadowHandleKey].id).toBe(id);
    const update1 = store.getRefUpdates();
    expect(update1).toEqual({ [id]: true });
  }
  scope();

  // allocate a hell lot of memory until it's consumed
  let finished = false;
  let discarded = false;
  allocateManyMemory(() => {
    if (!finished) {
      const update2 = store.getRefUpdates();
      if (update2[id] === false) finished = discarded = true;
    }
    return finished;
  });
  for (let i = 0; i < 30 && !discarded; i++) await sleep(0.1);
  // it should've been garbage collected by this time
  finished = true;
  expect(discarded).toBe(true);
});

// a non-awaitable function
function allocateManyMemory(jobFinished: () => boolean): void {
  function job() {
    // consume memory
    Array.from({ length: 1048576 }, () => () => () => () => {});
    if (jobFinished()) return;
    // create a new js job to trigger garbage collection
    setTimeout(job, 0);
  }
  job();
}

import {
  IStrongObjectStore,
  StrongObjectStore,
} from "../../src/proxy/objstore";

test("correct management of variable lifetimes", async () => {
  const store: IStrongObjectStore = new StrongObjectStore();
  type Item = { sig: number };
  const item: Item = { sig: 2333 };

  // insert a new item
  const handle = store.insert(item);
  const queried1 = store.query<Item>(handle);
  expect(queried1.has).toBe(true);
  expect(queried1.val === item).toBe(true);
  // fetch lifetimes
  const update1 = store.getRefUpdates();
  expect(update1).toEqual({ [handle]: true });
  const update2 = store.getRefUpdates();
  expect(update2).toEqual({});

  // announce that there are multiple instances referring to this item
  store.updateRefs({ [handle]: 2 });
  // there shouldn't be any changes happening within this store
  const update3 = store.getRefUpdates();
  expect(update3).toEqual({});

  // announce that this is the sole instance holding this item
  store.updateRefs({ [handle]: 1 });
  // the item should be removed from the store
  const update4 = store.getRefUpdates();
  expect(update4).toEqual({ [handle]: false });

  // ensure that this value is removed
  const queried2 = store.query<Item>(handle);
  expect(queried2.has).toBe(false);
  expect(queried2.val).toBeUndefined();
});

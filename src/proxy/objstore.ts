import { ObjectID } from "../network/protocol";
import { createUniqueId } from "../util/crypto";
import { None, Option, Some } from "../util/types";

/**
 * Stores all the data within any single thread that may be accessible by other
 * threads. This object store is responsive for managing references (i.e.
 * strong refs) to held objects and their corresponding lifetimes.
 */
export interface IStrongObjectStore {
  /**
   * Inserts a new item. The identifier is returned. Note that once after
   * inserting this item, there will be no turning back as you've broadcasted
   * it to all other threads. You must wait for all other server threads to
   * announce that they've released references to this object.
   */
  insert<T = any>(item: T): ObjectID;

  /** Fetches an item with this identifier. */
  query<T = any>(id: ObjectID): Option<T>;

  /**
   * Use a 'global reference count' announced by the global router to update
   * strong references within this store where the selves are located. Those
   * that are no longer referred to by other threads will be removed.
   *
   * Note that removing objects does not cause a problem (i.e. what should we
   * do if anyone on the master thread is still keeping a reference of it), as
   * all shadows are forgotten and a 'create shadow' action only happens when
   * the object is being sent through the network.
   */
  updateRefs(refs: Record<ObjectID, number>): void;

  /**
   * Fetch (strong) reference count *deltas* held by this store. `true`
   * indicates creating a new object and `false` indicates removing an object.
   */
  getRefUpdates(): Record<ObjectID, boolean>;
}

export const ShadowHandleKey = Symbol("ShadowHandleKey");

export interface IShadowHandleKey {
  id: ObjectID;
}

export interface IShadowHandle {
  /**
   * The ID of the actual object on another server. The value of this entry is
   * so given to keep hold of the garbage collection in the event of an object
   * spread (albeit being extremely rare and unlikely to be possible).
   */
  readonly [ShadowHandleKey]: IShadowHandleKey;
}

/**
 * Stores only shadows to objects over the network. The actual self of that
 * object is always located on another server thread. This store should keep
 * track of shadows on this server (thread), and report a garbage collection
 * on this object when all shadows are de-referenced.
 */
export interface IWeakObjectStore {
  /**
   * Inserts a new item reference via its ID. Returns the shadow handle. Note
   * that this shadow handle is
   */
  insert(id: ObjectID): IShadowHandle;

  /** Fetch item with identifier. */
  query(id: ObjectID): IShadowHandle | undefined;

  /** @see {@link IStrongObjectStore.updateRefs} */
  updateRefs(refs: Record<ObjectID, number>): void;

  /** @see {@link IStrongObjectStore.getRefUpdates} */
  getRefUpdates(): Record<ObjectID, boolean>;
}

export class StrongObjectStore implements IStrongObjectStore {
  /** Simply a directory of objects. */
  private _storage: Record<ObjectID, any>;
  /** Reports ref deltas. */
  private _nextRefUpdate: Record<ObjectID, boolean>;

  constructor() {
    this._storage = {};
    this._nextRefUpdate = {};
  }

  insert<T = any>(item: T): ObjectID {
    const id = createUniqueId();
    this._storage[id] = item;
    this._nextRefUpdate[id] = true;
    return id;
  }

  query<T = any>(id: ObjectID): Option<T> {
    if (!(id in this._storage)) return None();
    return Some(this._storage[id] as T);
  }

  updateRefs(refs: Record<string, number>): void {
    // if any ref is only ref'd by only one thread, then that is me
    for (const id of Object.keys(this._storage))
      if ((refs[id] ?? 0) < 2) {
        delete this._storage[id];
        this._nextRefUpdate[id] = false;
      }
    return;
  }

  getRefUpdates(): Record<string, boolean> {
    const updates = this._nextRefUpdate;
    this._nextRefUpdate = {};
    return updates;
  }
}

export class WeakObjectStore implements IWeakObjectStore {
  /** A storage of object handles. They are weak references to the handles. */
  private _storage: Record<ObjectID, WeakRef<IShadowHandleKey>>;
  /** Monitoring garbage collector on handle keys. */
  private _gcWatcher: FinalizationRegistry<ObjectID>;
  /** Reports ref deltas. */
  private _nextRefUpdate: Record<ObjectID, boolean>;

  constructor() {
    this._storage = {};
    this._gcWatcher = new FinalizationRegistry((id) => {
      delete this._storage[id];
      this._nextRefUpdate[id] = false;
    });
    this._nextRefUpdate = {};
  }

  insert(id: string): IShadowHandle {
    const key: IShadowHandleKey = { id: id };
    this._storage[id] = new WeakRef(key);
    this._gcWatcher.register(key, id);
    this._nextRefUpdate[id] = true;
    return { [ShadowHandleKey]: key };
  }

  query(id: string): IShadowHandle | undefined {
    const handle = this._storage[id]?.deref();
    if (handle === undefined) return undefined;
    return { [ShadowHandleKey]: handle };
  }

  updateRefs(refs: Record<string, number>): void {
    // shadow stores rely only on themselves
    return;
  }

  getRefUpdates(): Record<string, boolean> {
    const updates = this._nextRefUpdate;
    this._nextRefUpdate = {};
    return updates;
  }
}

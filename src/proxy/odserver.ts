import { createUniqueId } from "../util/crypto";
import { None, Option, Some } from "../util/types";

/**
 * Stores all the data within a thread (main thread incl.) which are to be
 * passed to other threads. These objects may be called with RMI whenever
 * required *since functions are not Structured-clone-able*.
 */
export class ObjectDirectoryServer {
  /** Simply a directory of objects. */
  private _storage: Record<string, any>;

  constructor() {
    this._storage = {};
  }

  /** Inserts a new item. The identifier is returned. */
  insert<T = any>(item: T): string {
    const id = createUniqueId();
    this._storage[id] = item;
    return id;
  }

  /** Fetches an item with this identifier. */
  query<T = any>(id: string): Option<T> {
    if (!(id in this._storage)) return None();
    return Some(this._storage[id] as T);
  }

  /** Removes item with this identifier from the directory. */
  remove(id: string): void {
    delete this._storage[id];
  }
}

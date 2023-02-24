/**
 * The union result takes in a {@link Promise} and an {@link AsyncGenerator},
 * combines them into one compatible one which should be responsive to both
 * situations, depending on how the users call it.
 *
 * The caller should hold responsible that the provided {@link Promise} and the
 * {@link AsyncGenerator} has similar behaviors. An additional fallback method
 * can be used to handle fields that are not covered by the resolvers.
 *
 * @internal
 */
export function createUnionResult<T, R>(
  promise: Promise<R>,
  generator: AsyncGenerator<T, R>,
  fallback: (key: string | symbol) => void
) {
  const _aggregate = {
    _promise: promise,
    _generator: generator,
    _fallback: fallback,
  };
  const proxy = new Proxy(_aggregate, {
    get(aggregate, key) {
      if (key === "then" || key === "catch" || key === "finally")
        return aggregate._promise[key].bind(aggregate._promise);
      if (key === "next" || key === "return" || key === "throw")
        return aggregate._generator[key].bind(aggregate._generator);
      if (key === Symbol.asyncIterator) return () => aggregate._generator;
      return aggregate._fallback(key);
    },
  });
  return proxy as unknown as Promise<R> & AsyncGenerator<T, R>;
}

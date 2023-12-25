import { pooledMap } from "./deps.ts";

export const extras = {
  nproc(): number {
    return navigator.hardwareConcurrency;
  },
  async xargs<T, R>(
    array: Iterable<T> | AsyncIterable<T>,
    iteratorFn: (data: T) => Promise<R>,
    parallel = 1,
  ) {
    const processed = pooledMap(parallel, array, iteratorFn);
    for await (const _ of processed);
  },
};

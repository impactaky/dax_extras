import { pooledMap } from "./deps.ts";

export const extras = {
  nproc(): number {
    return navigator.hardwareConcurrency;
  },
  split(s: string) : string[] {
    return s.trim().split(/\s+/);
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

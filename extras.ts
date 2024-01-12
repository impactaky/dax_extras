import { CommandBuilder, pooledMap, TextLineStream } from "./deps.ts";
import { LineStream } from "./LineStream/LineStream.ts";
import $ from "./mod.ts";
import { PathRefLike } from "./mod.ts";

export const extras = {
  nproc(): number {
    return navigator.hardwareConcurrency;
  },
  split(s: string): string[] {
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
  cat(file: PathRefLike): LineStream {
    const pathRef = $.path(file);
    return new LineStream(
      pathRef.openSync().readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream()),
    );
  },
  command(command: string | string[]): CommandBuilder {
    return new CommandBuilder().command(command);
  },
};

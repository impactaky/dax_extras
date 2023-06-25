import { CommandBuilder, CommandChild, CommandResult } from "../deps.ts";

import {
  FilterFunction,
  FilterStream,
  MapFunction,
  MapStream,
} from "./transformer.ts";

export type XargsFunction = (arg0: string) => CommandBuilder;

class LineToByteStream extends TransformStream<string, Uint8Array> {
  #encoder: TextEncoder;
  constructor() {
    super({
      transform: (line, controller) => this.#handle(line, controller),
    });
    this.#encoder = new TextEncoder();
  }
  #handle(
    line: string,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    const byte = this.#encoder.encode(line + "\n");
    controller.enqueue(byte);
  }
}

export class LineStream {
  stream: ReadableStream;
  constructor(stream: ReadableStream) {
    this.stream = stream;
  }
  pipeThrough(transform: TransformStream): LineStream {
    return new LineStream(this.stream.pipeThrough(transform));
  }
  async *[Symbol.asyncIterator]() {
    const reader = this.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  }
  pipe(next: CommandBuilder): CommandBuilder {
    const pipedStream = this.stream.pipeThrough(new LineToByteStream());
    return next.stdin(pipedStream);
  }
  $(next: string): CommandBuilder {
    const pipedStream = this.stream.pipeThrough(new LineToByteStream());
    return new CommandBuilder().command(next).stdin(pipedStream);
  }
  map(mapFunction: MapFunction<string, string>): LineStream {
    return this.pipeThrough(new MapStream(mapFunction));
  }
  filter(filterFunction: FilterFunction<string>): LineStream {
    return this.pipeThrough(new FilterStream(filterFunction));
  }
  async xargs(command: XargsFunction): Promise<CommandResult[]> {
    const processes: CommandChild[] = [];
    for await (const line of this.stream) {
      processes.push(command(line).stdout("piped").spawn());
    }
    return await Promise.all(processes);
  }
}

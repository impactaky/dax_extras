import { CommandBuilder, PathRef } from "../deps.ts";
import { StreamInterface } from "./Stream.ts";
import $ from "../mod.ts";

import {
  ApplyFunction,
  ApplyStream,
  FilterFunction,
  FilterStream,
  MapFunction,
  MapStream,
  RawMapFunction,
  RawMapStream,
} from "./Transformer.ts";
import { XargsStream } from "./XargsStream.ts";

export type XargsFunction = MapFunction<string, CommandBuilder>;

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

/**
 * Represents a stream of lines for reading the output of a command.
 * It implements an async iterator, allowing iteration over the lines.
 */
export class LineStream implements StreamInterface {
  #stream: ReadableStream;

  /**
   * Constructs a new `LineStream` with the provided readable stream.
   * @param stream - The readable stream to create the line stream from.
   */
  constructor(stream: ReadableStream) {
    this.#stream = stream;
  }

  async *[Symbol.asyncIterator]() {
    const reader = this.#stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  }

  async text(): Promise<string> {
    let text = "";
    for await (const line of this.#stream) {
      text += line + "\n";
    }
    return text;
  }

  async lines(): Promise<string[]> {
    const lines: string[] = [];
    for await (const line of this.#stream) {
      lines.push(line);
    }
    return lines;
  }

  async toFile(
    path: PathRef | string,
    options?: Deno.WriteFileOptions,
  ): Promise<void> {
    const pathRef: PathRef = typeof path == "string" ? $.path(path) : path;
    const file = await pathRef.open({
      write: true,
      create: true,
      ...options,
    });
    return this.byteStream().pipeTo(file.writable);
  }

  async appendToFile(
    path: PathRef | string,
    options?: Deno.WriteFileOptions,
  ): Promise<void> {
    return await this.toFile(path, { append: true, ...options });
  }

  pipeThrough(transform: TransformStream): LineStream {
    return new LineStream(this.#stream.pipeThrough(transform));
  }

  byteStream(): ReadableStream<Uint8Array> {
    return this.#stream.pipeThrough(new LineToByteStream());
  }

  pipe(next: CommandBuilder): CommandBuilder {
    return next.stdin(this.byteStream());
  }

  $(next: string): CommandBuilder {
    return new CommandBuilder().command(next).stdin(this.byteStream());
  }

  lineStream(): LineStream {
    return this;
  }

  map(mapFunction: MapFunction<string, string>): LineStream {
    return this.pipeThrough(new MapStream(mapFunction));
  }

  filter(filterFunction: FilterFunction<string>): LineStream {
    return this.pipeThrough(
      new FilterStream(filterFunction),
    );
  }

  xargs(xargsFunction: XargsFunction): XargsStream {
    return new XargsStream(
      this.#stream.pipeThrough(new RawMapStream(xargsFunction)),
    );
  }

  apply(applyFunction: ApplyFunction<string, string>) {
    return this.pipeThrough(new ApplyStream(applyFunction));
  }

  async forEach<T>(callback: RawMapFunction<string, T>) {
    const promises: Promise<T>[] = [];
    for await (const line of this) {
      promises.push(Promise.resolve(callback(line)));
    }
    return Promise.all(promises);
  }
}

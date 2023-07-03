import { CommandBuilder } from "../deps.ts";

import {
  ApplyFunction,
  ApplyStream,
  FilterFunction,
  FilterStream,
  MapFunction,
  MapStream,
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
export class LineStream {
  #stream: ReadableStream;

  /**
   * Constructs a new `LineStream` with the provided readable stream.
   * @param stream - The readable stream to create the line stream from.
   */
  constructor(stream: ReadableStream) {
    this.#stream = stream;
  }

  /**
   * Async iterator implementation for iterating over the lines of the stream.
   * @returns An async iterator for iterating over the lines of the stream.
   */
  async *[Symbol.asyncIterator]() {
    const reader = this.#stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  }

  /**
   * Reads the entire stream and returns the concatenated text.
   * @returns A promise that resolves to the concatenated text.
   */
  async text(): Promise<string> {
    let text = "";
    for await (const line of this.#stream) {
      text += line + "\n";
    }
    return text;
  }

  /**
   * Reads the entire stream and returns an array of lines.
   * @returns A promise that resolves to an array of lines.
   */
  async lines(): Promise<string[]> {
    const lines: string[] = [];
    for await (const line of this.#stream) {
      lines.push(line);
    }
    return lines;
  }

  /**
   * Pipes the stream through a transform stream.
   * @param transform - The transform stream to pipe the line stream through.
   * @returns A new line stream representing the piped stream.
   */
  pipeThrough(transform: TransformStream): LineStream {
    return new LineStream(this.#stream.pipeThrough(transform));
  }

  /**
   * Get stream as Uint8Array
   * @returns The encoded stream.
   */
  byteStream(): ReadableStream<Uint8Array> {
      return this.#stream.pipeThrough(new LineToByteStream());
  }

  /**
   * Pipes a command into the stdin of the next command in the chain.
   * @param next - The CommandBuilder representing the next command.
   * @returns The CommandBuilder with the stdin piped from the current stream.
   */
  pipe(next: CommandBuilder): CommandBuilder {
    return next.stdin(this.byteStream());
  }

  /**
   * Pipes a command into the stdin of the next command in the chain.
   * @param next - The command as a string to pipe into.
   * @returns The CommandBuilder with the stdin piped from the current stream.
   */
  $(next: string): CommandBuilder {
    return new CommandBuilder().command(next).stdin(this.byteStream());
  }

  /**
   * Maps the stream using a map function, allowing further processing.
   * @param mapFunction - The function to map the output of each line.
   * @returns A new line stream resulting from the mapping operation.
   */
  map(mapFunction: MapFunction<string, string>): LineStream {
    return this.pipeThrough(new MapStream(mapFunction));
  }

  /**
   * Filters the stream using a filter function, allowing further processing.
   * @param filterFunction - The function to filter the output of each line.
   * @returns A new line stream resulting from the filtering operation.
   */
  filter(filterFunction: FilterFunction<string>): LineStream {
    return this.pipeThrough(new FilterStream(filterFunction));
  }

  /**
   * Create a CommandBuilder for each line of the stream using the provided xargs function.
   * @param xargsFunction - The xargs function that handles the execution of command lines.
   * @returns A readable stream of CommandBuilder.
   */
  xargs(xargsFunction: XargsFunction): XargsStream {
    return new XargsStream(
      this.#stream.pipeThrough(new MapStream(xargsFunction)),
    );
  }

  /**
   * Applies a given function to the stream, transforming each item of the stream
   * as specified by the function. The function may return a transformed item, an array of transformed items, or `undefined`.
   * When a transformed item or an array of items is returned, it/they are enqueued to the output stream.
   * If `undefined` is returned, the item is ignored and not included in the output stream.
   * @param applyFunction - A function to be applied to each item in the stream.
   * This function takes an item of type `T`, and returns either a transformed item of type `U`,
   * `U[]`, or `undefined`.
   * @returns A new `ReadableStream` instance that will contain the transformed items.
   */
  apply(applyFunction: ApplyFunction<string, string>) {
    return this.pipeThrough(new ApplyStream(applyFunction));
  }
}

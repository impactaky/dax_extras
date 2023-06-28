import { CommandBuilder } from "../deps.ts";

import {
  FilterFunction,
  FilterStream,
  MapFunction,
  MapStream,
} from "./Transformer.ts";

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
   * Pipes a command into the stdin of the next command in the chain.
   * @param next - The CommandBuilder representing the next command.
   * @returns The CommandBuilder with the stdin piped from the current stream.
   */
  pipe(next: CommandBuilder): CommandBuilder {
    const pipedStream = this.#stream.pipeThrough(new LineToByteStream());
    return next.stdin(pipedStream);
  }

  /**
   * Pipes a command into the stdin of the next command in the chain.
   * @param next - The command as a string to pipe into.
   * @returns The CommandBuilder with the stdin piped from the current stream.
   */
  $(next: string): CommandBuilder {
    const pipedStream = this.#stream.pipeThrough(new LineToByteStream());
    return new CommandBuilder().command(next).stdin(pipedStream);
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
   * Executes a command for each line of the stream using the provided xargs function.
   * @param xargsFunction - The xargs function that handles the execution of command lines.
   * @returns A promise that resolves to an array of CommandBuilders representing the executed commands.
   */
  async xargs(xargsFunction: XargsFunction): Promise<CommandBuilder[]> {
    const processes: CommandBuilder[] = [];
    for await (const line of this.#stream) {
      processes.push(command(line));
    }
    return processes;
  }
}

import { CommandBuilder, PathRef } from "../deps.ts";
import { LineStream, XargsFunction } from "./LineStream.ts";
import { ApplyFunction, FilterFunction, MapFunction } from "./Transformer.ts";
import { XargsStream } from "./XargsStream.ts";

export interface StreamInterface {
  /**
   * Async iterator implementation for iterating over the lines of the stream.
   * @returns An async iterator for iterating over the lines of the stream.
   */
  [Symbol.asyncIterator](): AsyncGenerator;

  /**
   * Reads the entire stream and returns the concatenated text.
   * @returns A promise that resolves to the concatenated text.
   */
  text(): Promise<string>;

  /**
   * Reads the entire stream and returns an array of lines.
   * @returns A promise that resolves to an array of lines.
   */
  lines(): Promise<string[]>;

  /**
   * Pipes the stream through a transform stream.
   * @param transform - The transform stream to pipe the line stream through.
   * @returns A new line stream representing the piped stream.
   */
  pipeThrough(transform: TransformStream): LineStream;

  /**
   * Get stream as Uint8Array
   * @returns The encoded stream.
   */
  byteStream(): ReadableStream<Uint8Array>;

  /**
   * Pipes the output of the current command into another command.
   * @param next - The command to pipe into.
   * @returns A new command builder representing the piped command.
   */
  pipe(next: CommandBuilder): CommandBuilder;

  /**
   * Pipes the output of the current command into another command.
   * @param next - The command as a string to pipe into.
   * @returns A new command builder representing the piped command.
   */
  $(next: string): CommandBuilder;

  /**
   * Creates a new line stream for reading the output of the command.
   * @returns The line stream.
   */
  lineStream(): LineStream;

  /**
   * Maps the output of a function that returns a line stream, allowing further processing.
   * @param mapFunction - The function to map the output.
   * @returns The line stream resulting from the mapping operation.
   */
  map(mapFunction: MapFunction<string, string>): LineStream;

  /**
   * Filters the output of a function that returns a line stream, allowing further processing.
   * @param filterFunction - The function to filter the output.
   * @returns The line stream resulting from the filtering operation.
   */
  filter(filterFunction: FilterFunction<string>): LineStream;

  /**
   * Builds and executes command lines using the standard input.
   * @param xargsFunction - The function that handles the execution of command lines.
   * @returns A promise that resolves to an array of command builders representing the executed commands.
   */
  xargs(xargsFunction: XargsFunction): XargsStream;

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
  apply(applyFunction: ApplyFunction<string, string>): LineStream;

  /**
   * Writes data from a stream to a file asynchronously.
   * @param path - The path reference object where the file will be written to.
   * @returns Returns a promise which resolves when the operation completes.
   */
  toFile(path: PathRef): Promise<void>;
}

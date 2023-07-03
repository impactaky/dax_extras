import {
  CommandBuilder,
  CommandResult,
  TextLineStream,
  toTransformStream,
} from "../deps.ts";
import { LineStream, XargsFunction } from "./LineStream.ts";
import {
  ApplyFunction,
  FilterFunction,
  MapFunction,
} from "../LineStream/Transformer.ts";
import { StreamInterface } from "./Stream.ts";

export class XargsStream
  implements StreamInterface, PromiseLike<CommandResult[]> {
  #stream: ReadableStream<CommandBuilder>;

  then<TResult1 = CommandResult[], TResult2 = never>(
    onfulfilled?:
      | ((value: CommandResult[]) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: Error) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    const promise = (async () => {
      const ret: CommandResult[] = [];
      for await (const builder of this.#stream) {
        // typescript bug: builder is CommandBuilder not CommandResult
        ret.push(await (builder as unknown as CommandBuilder));
      }
      return ret;
    })();
    return promise.then(onfulfilled, onrejected);
  }

  /**
   * Constructs a new `XargsStream` with the provided readable stream.
   * @param stream - The readable stream to create the xargs stream from.
   */
  constructor(stream: ReadableStream) {
    this.#stream = stream;
  }

  /**
   * Async iterator implementation for iterating over the CommandBuilders of the stream.
   * @returns An async iterator for iterating over the CommandBuilders of the stream.
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
  text() {
    return this.lineStream().text();
  }

  /**
   * Reads the entire stream and returns an array of lines.
   * @returns A promise that resolves to an array of lines.
   */
  lines() {
    return this.lineStream().lines();
  }

  /**
   * Creates a new byte stream for reading the output of the xargs.
   * @returns The byte stream.
   */
  byteStream(): ReadableStream<Uint8Array> {
    return this.#stream.pipeThrough(toTransformStream(async function* (src) {
      for await (const builder of src) {
        const new_stream = builder.stdout("piped").spawn().stdout();
        for await (const line of new_stream) {
          yield line;
        }
      }
    }));
  }

  /**
   * Pipes the output of the current command into another command.
   * @param next - The CommandBuilder representing the next command.
   * @returns A new command builder representing the piped command.
   */
  pipe(next: CommandBuilder): CommandBuilder {
    const pipedStream = this.byteStream();
    return next.stdin(pipedStream);
  }

  /**
   * Pipes the output of the current command into another command.
   * @param next - The command as a string to pipe into.
   * @returns A new command builder representing the piped command.
   */
  $(next: string): CommandBuilder {
    const pipedStream = this.byteStream();
    return new CommandBuilder().command(next).stdin(pipedStream);
  }

  /**
   * Creates a new line stream for reading the output of the xargs.
   * @returns The line stream.
   */
  lineStream(): LineStream {
    return new LineStream(
      this.byteStream()
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream()),
    );
  }

  /**
   * Maps the output of a function that returns a line stream, allowing further processing.
   * @param mapFunction - The function to map the output.
   * @returns The line stream resulting from the mapping operation.
   */
  map(
    mapFunction: MapFunction<string, string>,
  ) {
    return this.lineStream().map(mapFunction);
  }

  /**
   * Filters the output of a function that returns a line stream, allowing further processing.
   * @param filterFunction - The function to filter the output.
   * @returns The line stream resulting from the filtering operation.
   */
  filter(
    filterFunction: FilterFunction<string>,
  ) {
    return this.lineStream().filter(filterFunction);
  }

  /**
   * Create a CommandBuilder for each line of the stream using the provided xargs function.
   * @param xargsFunction - The xargs function that handles the execution of command lines.
   * @returns A readable stream of CommandBuilder.
   */
  xargs(
    xargsFunction: XargsFunction,
  ) {
    return this.lineStream().xargs(xargsFunction);
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
  apply(
    applyFunction: ApplyFunction<string, string>,
  ) {
    return this.lineStream().apply(applyFunction);
  }
}

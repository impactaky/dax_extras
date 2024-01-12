import {
  CommandBuilder,
  CommandResult,
  PathRef,
  TextLineStream,
  toTransformStream,
} from "../deps.ts";
import { LineStream, XargsFunction } from "./LineStream.ts";
import {
  ApplyFunction,
  FilterFunction,
  MapFunction,
  RawMapFunction,
} from "../LineStream/Transformer.ts";
import { StreamInterface } from "./Stream.ts";
import $ from "../mod.ts";
import { PathRefLike } from "../mod.ts";

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
        // https://github.com/microsoft/TypeScript/issues/47593
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

  async *[Symbol.asyncIterator]() {
    const reader = this.#stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  }

  text() {
    return this.lineStream().text();
  }

  lines() {
    return this.lineStream().lines();
  }

  async toFile(path: PathRefLike, options?: Deno.WriteFileOptions) {
    const pathRef: PathRef = $.path(path);
    const file = await pathRef.open({ write: true, create: true, ...options });
    return await this.byteStream().pipeTo(file.writable);
  }

  async appendToFile(path: PathRefLike, options?: Deno.WriteFileOptions) {
    return await this.toFile(path, { append: true, ...options });
  }

  pipeThrough(transform: TransformStream): LineStream {
    return this.lineStream().pipeThrough(transform);
  }

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

  pipe(next: CommandBuilder): CommandBuilder {
    const pipedStream = this.byteStream();
    return next.stdin(pipedStream);
  }

  $(next: string): CommandBuilder {
    const pipedStream = this.byteStream();
    return new CommandBuilder().command(next).stdin(pipedStream);
  }

  lineStream(): LineStream {
    return new LineStream(
      this.byteStream()
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream()),
    );
  }

  map(
    mapFunction: MapFunction<string, string>,
  ) {
    return this.lineStream().map(mapFunction);
  }

  filter(
    filterFunction: FilterFunction<string>,
  ) {
    return this.lineStream().filter(filterFunction);
  }

  xargs(
    xargsFunction: XargsFunction,
  ) {
    return this.lineStream().xargs(xargsFunction);
  }

  apply(
    applyFunction: ApplyFunction<string, string>,
  ) {
    return this.lineStream().apply(applyFunction);
  }

  forEach<T>(
    callback: RawMapFunction<string, T>,
  ) {
    return this.lineStream().forEach(callback);
  }
}

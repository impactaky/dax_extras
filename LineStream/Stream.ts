import { CommandBuilder } from "../deps.ts";
import { XargsFunction } from "./LineStream.ts";
import { ApplyFunction, FilterFunction, MapFunction } from "./Transformer.ts";
import { XargsStream } from "./XargsStream.ts";

export interface StreamInterface {
  [Symbol.asyncIterator](): AsyncGenerator;
  text(): Promise<string>;
  lines(): Promise<string[]>;
  // TODO: should this be added ?
  // pipeThrough(transform: TransformStream): LineStreamInterface;
  byteStream(): ReadableStream<Uint8Array>;
  pipe(next: CommandBuilder): CommandBuilder;
  $(next: string): CommandBuilder;
  map(mapFunction: MapFunction<string, string>): StreamInterface;
  filter(filterFunction: FilterFunction<string>): StreamInterface;
  xargs(xargsFunction: XargsFunction): XargsStream;
  apply(applyFunction: ApplyFunction<string, string>): StreamInterface;
}

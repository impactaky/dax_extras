import { $, CommandBuilder, PathRef, TextLineStream } from "./deps.ts";

import {
  ApplyFunction,
  FilterFunction,
  MapFunction,
  RawMapFunction,
} from "./LineStream/Transformer.ts";
import { LineStream, XargsFunction } from "./LineStream/LineStream.ts";
import { StreamInterface } from "./LineStream/Stream.ts";

declare module "./deps.ts" {
  // deno-lint-ignore no-empty-interface
  interface CommandBuilder extends StreamInterface {}
}

CommandBuilder.prototype.toFile = async function (path: PathRef) {
  await path.write(await this.bytes());
};

CommandBuilder.prototype.pipe = function (next: CommandBuilder) {
  const p = this.stdout("piped").spawn();
  return next.stdin(p.stdout());
};

CommandBuilder.prototype.$ = function (next: string) {
  const p = this.stdout("piped").spawn();
  return new CommandBuilder().command(next).stdin(p.stdout());
};

CommandBuilder.prototype.lineStream = function () {
  return new LineStream(
    this.stdout("piped").spawn().stdout().pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream()),
  );
};

CommandBuilder.prototype.map = function (
  mapFunction: MapFunction<string, string>,
) {
  return this.lineStream().map(mapFunction);
};

CommandBuilder.prototype.filter = function (
  filterFunction: FilterFunction<string>,
) {
  return this.lineStream().filter(filterFunction);
};

CommandBuilder.prototype.xargs = function (
  xargsFunction: XargsFunction,
) {
  return this.lineStream().xargs(xargsFunction);
};

CommandBuilder.prototype.apply = function (
  applyFunction: ApplyFunction<string, string>,
) {
  return this.lineStream().apply(applyFunction);
};

CommandBuilder.prototype.forEach = async function <T>(
  callback: RawMapFunction<string, T>,
) {
  return this.lineStream().forEach(callback);
};

export default $;

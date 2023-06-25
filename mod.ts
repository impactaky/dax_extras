import { $, CommandBuilder, CommandResult, TextLineStream } from "./deps.ts";

import { FilterFunction, MapFunction } from "./linestream/transformer.ts";
import { LineStream, XargsFunction } from "./linestream/linestream.ts";

declare module "./deps.ts" {
  interface CommandBuilder {
    pipe(): ReadableStream<Uint8Array>;
    lineStream(): LineStream;
    $(next: string): CommandBuilder;
    map(mapFunction: MapFunction<string, string>): LineStream;
    filter(filterFunction: FilterFunction<string>): LineStream;
    xargs(xargsFunction: XargsFunction): Promise<CommandResult[]>;
  }
}

CommandBuilder.prototype.pipe = function () {
  return this.stdout("piped").spawn().stdout();
};

CommandBuilder.prototype.lineStream = function () {
  return new LineStream(
    this.pipe().pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream()),
  );
};

CommandBuilder.prototype.$ = function (next: string) {
  const p = this.stdout("piped").spawn();
  return new CommandBuilder().command(next).stdin(p.stdout());
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

CommandBuilder.prototype.xargs = async function (
  xargsFunction: XargsFunction,
) {
  return await this.lineStream().xargs(xargsFunction);
};

export default $;

import { CommandBuilder, TextLineStream } from "./deps.ts";

import { FilterFunction, MapFunction } from "./LineStream/Transformer.ts";
import { LineStream, XargsFunction } from "./LineStream/LineStream.ts";

declare module "./deps.ts" {
  interface CommandBuilder {
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
    xargs(xargsFunction: XargsFunction): Promise<CommandBuilder[]>;
  }
}

export const SUPPORTED_VERSION = "0.32.0";
export function addExtras(
  commandBuilder: typeof CommandBuilder,
  version: string,
) {
  if (version !== SUPPORTED_VERSION) {
    throw new Error(
      "dax version is unsuported, needs dax version: " +
        SUPPORTED_VERSION,
    );
  }
  commandBuilder.prototype.pipe = function (next: CommandBuilder) {
    const p = this.stdout("piped").spawn();
    return next.stdin(p.stdout());
  };

  commandBuilder.prototype.$ = function (next: string) {
    const p = this.stdout("piped").spawn();
    return new CommandBuilder().command(next).stdin(p.stdout());
  };

  commandBuilder.prototype.lineStream = function () {
    return new LineStream(
      this.stdout("piped").spawn().stdout().pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream()),
    );
  };

  commandBuilder.prototype.map = function (
    mapFunction: MapFunction<string, string>,
  ) {
    return this.lineStream().map(mapFunction);
  };

  commandBuilder.prototype.filter = function (
    filterFunction: FilterFunction<string>,
  ) {
    return this.lineStream().filter(filterFunction);
  };

  commandBuilder.prototype.xargs = function (
    xargsFunction: XargsFunction,
  ) {
    return this.lineStream().xargs(xargsFunction);
  };
}

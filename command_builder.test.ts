import { assertEquals } from "./test_deps.ts";
import { $, CommandBuilder } from "./deps.ts";
import { addExtras, SUPPORTED_VERSION } from "./mod.ts";

addExtras(CommandBuilder, SUPPORTED_VERSION);

Deno.test("Quick example", async () => {
  const stream = $`echo "abc\nabcde\nabcdef\nacddef\nbcdefg"`
    .map((l) => `bug : ${l}`)
    .$(`grep 'bug : a'`).noThrow()
    .pipe($`grep 'bug : ab'`).noThrow()
    .filter((l) => l.length > "bug : ".length + 5);
  for await (const line of stream) {
    assertEquals(line, "bug : abcdef");
  }
});

Deno.test("xargs one-line", async () => {
  const result = await $`echo hello`
    .xargs((input) => $`echo ${input} world`)
    .then((output) => output[0].xargs((input) => $`echo ${input} world2`));
  assertEquals(await result[0].text(), "hello world world2");
});

Deno.test("xargs multi-line", async () => {
  const result = await $`echo "line1\nline2"`
    .xargs((input) => $`echo ${input} world`);
  assertEquals(await result[0].text(), "line1 world");
  assertEquals(await result[1].text(), "line2 world");
});

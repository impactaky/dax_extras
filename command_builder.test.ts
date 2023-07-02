import $ from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

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

Deno.test("CommandBuilder.prototype.$", async () => {
  assertEquals(
    await $`echo a`
      .$(`echo b`)
      .text(),
    "b",
  );
});

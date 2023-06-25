import $ from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

Deno.test("Quick example", async () => {
  const stream = $`echo "abc\nabcde\nabcdef\nbcdefg"`
    .map((l) => `bug : ${l}`)
    .$(`grep 'bug : a'`).noThrow()
    .filter((l) => l.length > "bug : ".length + 5);
  for await (const line of stream) {
    assertEquals(line, "bug : abcdef");
  }
});

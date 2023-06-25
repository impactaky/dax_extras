import $ from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

Deno.test("Quick example", async () => {
  const stream = $`echo "abc\nabcde\nabcdef\nbcdefg"`
    .map((l) => {
      return `bug : ${l}`;
    })
    .$(`grep 'bug : a'`)
    .filter((l) => {
      return l.length > "bug : ".length + 5;
    });
  for await (const line of stream) {
    assertEquals(line, "bug : abcdef");
  }
});

import $ from "./mod.ts";
import { assertEquals } from "./test_deps.ts";
import {} from "https://deno.land/x/sigmastd@0.2.0/mod.ts";

Deno.test("Quick example", async () => {
  const stream = $`echo "abc\nabcde\nabcdef\nbcdefg"`
    .map((l) => `bug : ${l}`)
    .$(`grep 'bug : a'`).noThrow()
    .filter((l) => l.length > "bug : ".length + 5);
  for await (const line of stream) {
    assertEquals(line, "bug : abcdef");
  }

  const result = await $`echo hello`
    .xargs((input) => $`echo ${input} world`).then((output) =>
      output.result.xargs((input) => $`echo ${input} world2`)
    );
  assertEquals(await result.result.text(), "hello world world2");
});

import $ from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

Deno.test("Quick example", async () => {
  const lines = await $`echo "olleh\nnop\ndlrow\nnop\nnop"` // => ["olleh", "nop", "dlrow", "nop", "nop"]
    .$(`grep -v dummy`).noThrow() // => ["olleh", "nop", "dlrow", "nop", "nop"]
    .apply((l) => {
      if (l != "nop") {
        return l.split("").reverse().join("");
      }
    }) // => ["hello", "world"]
    .xargs((l) => $`echo ${l}!`)
    .lines();
  assertEquals(lines, ["hello!", "world!"]);
});

Deno.test("CommandBuilder.prototype.$", async () => {
  assertEquals(
    await $`echo a`
      .$(`echo b`)
      .text(),
    "b",
  );
});

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

Deno.test("commandBuilder smoke test", async () => {
  // TODO: can't reuse the same cmd, probably because pipe hooks stdin of the processes
  // can this be improved ?
  const cmd = $`echo 1`.pipe($`echo "2\n3"`);
  const cmd2 = $`echo 1`.pipe($`echo "2\n3"`);

  assertEquals(
    await cmd.map((l) => l + "0").text(),
    "20\n30\n",
  );
  assertEquals(
    await cmd2.filter((l) => l != "3").text(),
    "2\n",
  );
});

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

Deno.test("CommandBuilder.prototype.toFile", async () => {
  const path = $.path(await Deno.makeTempFile());
  await path.writeText("foo");
  await $`echo "line1\nline2"`.toFile(path);
  const text = path.readTextSync();
  console.log(text);
  assertEquals(text, "line1\nline2\n");
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
  const cmd = () => $`echo 1`.pipe($`echo "2\n3"`);

  assertEquals(
    await cmd().map((l) => l + "0").text(),
    "20\n30\n",
  );
  assertEquals(
    await cmd().filter((l) => l != "3").text(),
    "2\n",
  );
});

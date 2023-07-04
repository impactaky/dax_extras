import $ from "../mod.ts";
import { assertEquals } from "../test_deps.ts";

Deno.test("XargsStream async iterator", async () => {
  const cmd = $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"));
  const result = [];
  for await (const r of cmd) {
    result.push(r.stdout);
  }
  assertEquals(result, ["11\n", "22\n"]);
});

Deno.test("XargsStream.text", async () => {
  assertEquals(
    await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"))
      .text(),
    "11\n22\n",
  );
});

Deno.test("XargsStream.pipeThrough", async () => {
  assertEquals(
    await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"))
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new TextDecoderStream())
      .text(),
    "11\n22\n",
  );
});

Deno.test("XargsStream.map", async () => {
  assertEquals(
    await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"))
      .map((l) => l + "0").text(),
    "110\n220\n",
  );
});

Deno.test("XargsStream.filter", async () => {
  assertEquals(
    await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"))
      .filter((l) => !l.includes("2")).text(),
    "11\n",
  );
});

Deno.test("XargsStream.apply", async () => {
  assertEquals(
    await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"))
      .apply((l) => !l.includes("2") ? l + "0" : undefined).text(),
    "110\n",
  );
});

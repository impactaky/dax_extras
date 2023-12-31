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

Deno.test("XargsStream.toFile(PathRef)", async () => {
  const path = $.path(await Deno.makeTempFile());
  path.writeText("foo");
  await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped")).toFile(
    path,
  );
  const text = path.readTextSync();
  assertEquals(text, "11\n22\n");
});

Deno.test("XargsStream.toFile(string)", async () => {
  const path = await Deno.makeTempFile();
  await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped")).toFile(
    path,
  );
  const text = $.path(path).readTextSync();
  assertEquals(text, "11\n22\n");
});

Deno.test("XargsStream.appendToFile", async () => {
  const path = $.path(await Deno.makeTempFile());
  path.writeText("foo");
  await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"))
    .appendToFile(
      path,
    );
  const text = path.readTextSync();
  assertEquals(text, "foo11\n22\n");
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

Deno.test("XargsStream.forEach", async () => {
  assertEquals(
    await $`echo "1\n2"`.xargs((i) => $`echo ${i}${i}`.stdout("piped"))
      .forEach((l) => !l.includes("2") ? l + "0" : undefined),
    ["110", undefined],
  );
});

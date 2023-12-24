import $ from "../mod.ts";
import { assertEquals } from "../test_deps.ts";
import { CommandResult } from "../deps.ts";

Deno.test("LineStream.text", async () => {
  const text = await $`echo "line1\nline2"`
    .lineStream().text();
  assertEquals(text, "line1\nline2\n");
});

Deno.test("LineStram.lines", async () => {
  const lines = await $`echo "line1\nline2"`
    .lineStream().lines();
  assertEquals(lines, ["line1", "line2"]);
});

Deno.test("LineStream.toFile", async () => {
  const path = $.path(await Deno.makeTempFile());
  await path.writeText("foo");
  await $`echo "line1\nline2"`
    .lineStream().toFile(path);
  const text = path.readTextSync();
  assertEquals(text, "line1\nline2\n");
});

Deno.test("LineStream.appendToFile", async () => {
  const path = $.path(await Deno.makeTempFile());
  await path.writeText("foo");
  await $`echo "line1\nline2"`
    .lineStream().appendToFile(path);
  const text = path.readTextSync();
  assertEquals(text, "fooline1\nline2\n");
});

Deno.test("LineStream.$", async () => {
  const text = await $`echo "line1\nline2"`
    .lineStream()
    .$(`cat`)
    .lines();
  assertEquals(text, ["line1", "line2"]);
});

Deno.test("LineStream.pipe", async () => {
  const text = await $`echo "line1\nline2"`
    .lineStream()
    .pipe($`cat`)
    .lines();
  assertEquals(text, ["line1", "line2"]);
});

Deno.test("LineStream.map", async () => {
  const text = await $`echo "line1\nline2"`
    .lineStream()
    .map((l) => {
      return `prefix:${l}`;
    })
    .lines();
  assertEquals(text, ["prefix:line1", "prefix:line2"]);
});

Deno.test("LineStream.filter", async () => {
  const text = await $`echo "333\n4444"`
    .lineStream()
    .filter((l) => {
      return l.length >= 4;
    })
    .lines();
  assertEquals(text, ["4444"]);
});

Deno.test("await LineStream.xargs", async () => {
  const result = await $`echo "line1\nline2"`
    .xargs((input) => $`echo ${input}`);
  assertEquals(result.length, 2);
  assertEquals(result[0] instanceof CommandResult, true);
});

Deno.test("LineStream.xargs one-line", async () => {
  const result = await $`echo hello`
    .lineStream()
    .xargs((input) => $`echo ${input} world`)
    .xargs((input) => $`echo ${input} world2`)
    .lines();
  assertEquals(result, ["hello world world2"]);
});

Deno.test("LineStream.xargs multi-line", async () => {
  const result = await $`echo "line1\nline2\nline3"`
    .lineStream()
    .xargs((input) => $`echo ${input} world`)
    .pipe($`grep -v 3`)
    .lines();
  assertEquals(result, ["line1 world", "line2 world"]);
});

Deno.test("LineStream.xargs.$", async () => {
  const result = await $`echo "line1\nline2"`
    .lineStream()
    .xargs((input) => $`echo ${input} world`)
    .$(`cat`)
    .lines();
  assertEquals(result, ["line1 world", "line2 world"]);
});

Deno.test("LineStream.apply return string", async () => {
  const result = await $`echo "prefix: val1\nprefix: val2\nprefix:\tval2"`
    .lineStream()
    .apply((l) => {
      const val = l.split(/\s+/)[1];
      if (val == "val2") {
        return `result ${val}`;
      }
    })
    .lines();
  assertEquals(result.length, 2);
  assertEquals(result[0], "result val2");
  assertEquals(result[1], "result val2");
});

Deno.test("LineStream.apply return string[]", async () => {
  const result = await $`echo "prefix: val1\nprefix: val2"`
    .lineStream()
    .apply((l) => {
      const val = l.split(/\s+/)[1];
      if (val == "val2") {
        return [`result1 ${val}`, `result2 ${val}`];
      }
    })
    .lines();
  assertEquals(result.length, 2);
  assertEquals(result[0], "result1 val2");
  assertEquals(result[1], "result2 val2");
});

Deno.test("LineStream.forEach", async () => {
  const result = await $`echo "prefix: val1\nprefix: val2"`
    .forEach((l) => {
      const val = l.split(/\s+/)[1];
      if (val == "val2") {
        return [`${val}`, `${val}`];
      }
    });
  assertEquals(result.length, 2);
  assertEquals(result[0], undefined);
  assertEquals(result[1], ["val2", "val2"]);
});

Deno.test("LineStream async iterator", async () => {
  const result = $`echo "prefix: val1\nprefix: val2"`
    .lineStream()
    .lineStream(); // noop

  const lines = [];
  for await (const line of result) {
    lines.push(line);
  }
  assertEquals(lines.length, 2);
  assertEquals(lines[0], "prefix: val1");
  assertEquals(lines[1], "prefix: val2");
});

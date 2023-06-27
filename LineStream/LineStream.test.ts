import $ from "../mod.ts";
import { assertEquals } from "../test_deps.ts";

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

Deno.test("LineStream.$", async () => {
  const text = await $`echo "line1\nline2"`
    .lineStream()
    .$(`cat`)
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

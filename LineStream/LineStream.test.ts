import $ from "../mod.ts";
import { assertEquals } from "../test_deps.ts";

Deno.test("LineStream.text()", async () => {
  const text = await $`echo "line1\nline2"`
    .lineStream().text();
  assertEquals(text, "line1\nline2\n");
});

Deno.test("LineStram.lines()", async () => {
  const lines = await $`echo "line1\nline2"`
    .lineStream().lines();
  assertEquals(lines, ["line1", "line2"]);
});

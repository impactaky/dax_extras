import $ from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

Deno.test("$.nproc", async () => {
  assertEquals($.nproc(), Number(await $`nproc`.text()));
});

import $ from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

Deno.test("$.nproc", async () => {
  assertEquals($.nproc(), Number(await $`nproc`.text()));
});

Deno.test("$.split", async () => {
  assertEquals($.split(" 1  2 3 "), ["1", "2", "3"]);
});

Deno.test("$.xargs", async () => {
  const func = async (n: number) => {
    await $.sleep(n * 100);
    return n * 2;
  };
  async function* generateNumbers() {
    yield 3;
    yield 2;
    yield 2;
  }
  // should end in 5second
  const resultPromise = $.xargs(generateNumbers(), func, 3);
  let timerId: number | undefined;
  const timeoutPromise = new Promise((_, reject) =>
    timerId = setTimeout(() => reject(new Error("Timeout")), 400)
  );
  try {
    await Promise.race([resultPromise, timeoutPromise]);
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
});

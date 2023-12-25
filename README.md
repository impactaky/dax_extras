# About

A useful util library for writing shell script stream processing using
[dsherret/dax](https://github.com/dsherret/dax).

## Quick example

```typescript
import $ from "https://deno.land/x/dax_extras/mod.ts";

const lines = await $`echo "olleh\nnop\ndlrow\nnop\nnop"` // => ["olleh", "nop", "dlrow", "nop", "nop"]
  .$(`grep -v dummy`).noThrow() // => ["olleh", "nop", "dlrow", "nop", "nop"]
  .apply((l) => {
    if (l != "nop") {
      return l.split("").reverse().join("");
    }
  }) // => ["hello", "world"]
  .xargs((l) => $`echo ${l}!`) // => ["hello!", "world!"]
  .lines();
console.log(lines);
```

## Functions

For more information, see [tests](LineStream/LineStream.test.ts).

### toFile

Save command stdout to a file.

```ts
$`command`.toFile(path);
```

### $, pipe

stdout pipe to next command stdin.

```ts
await $`command`.$(`next_command`);
await $`command`.pipe($`next_command`);
```

### map

Apply map function to each line of command stdout.

```ts
const text = await $`echo "line1\nline2"`
  .map((l) => {
    return `prefix:${l}`;
  })
  .lines();
assertEquals(text, ["prefix:line1", "prefix:line2"]);
```

### filter

Apply filter function to each line of command stdout.

```ts
const text = await $`echo "333\n4444"`
  .filter((l) => {
    return l.length >= 4;
  })
  .lines();
assertEquals(text, ["4444"]);
```

### xargs

Execute command with each line of command stdout as arguments.

```ts
const result = await $`echo hello`
  .xargs((input) => $`echo ${input} world`)
  .xargs((input) => $`echo ${input} world2`)
  .lines();
assertEquals(result, ["hello world world2"]);
```

```ts
const result = await $`echo "line1\nline2"`
  .xargs((input) => $`echo ${input}`);
assertEquals(result.length, 2);
assertEquals(result[0] instanceof CommandResult, true);
```

### apply

Apply function to each line of command stdout. If applied function return
undefined, the line will be ignored.

```ts
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
```

## Extra functions

See [extras.ts](extras.ts) and [extras.test.ts](extras.test.ts).

## Use with your dax extends

You can import dax_extras like this.

```typescript
import $ from "https://deno.land/x/dax@0.32.0/mod.ts";
// the dax version used internally by dax extras is at the suffix
// it **must** match the dax version used
import "https://deno.land/x/dax_extras@2.2.0-0.32.0/mod.ts";
```

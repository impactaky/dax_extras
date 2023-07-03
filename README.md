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

## Usage

Please see [tests](LineStream/LineStream.test.ts).

### Use with your dax extends

You can import dax_extras like this.

```typescript
import $ from "https://deno.land/x/dax@0.32.0/mod.ts";
import "https://raw.githubusercontent.com/impactaky/dax_extras/1.0.0/mod.ts";
```

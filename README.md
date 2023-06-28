# About

A useful util library for writing shell script stream processing using
[dsherret/dax](https://github.com/dsherret/dax).

## Quick example

```typescript
import {$, CommandBuilder} from "https://deno.land/x/dax@0.32.0/mod.ts";
import {addExtras} "https://raw.githubusercontent.com/impactaky/dax_extras/1.0.0/mod.ts";

addExtras(CommandBuilder, /*dax version*/ "0.32.0")

await $`echo "abc\nabcde\nabcdef\nbcdefg"`
  .map((l) => `bug : ${l}`)
  .$(`grep 'bug : a'`).noThrow()
  .filter((l) => l.length > "bug : ".length + 3)
  .xargs((l) => $`echo de${l}`);
// => debug : abcde
// => debug : abcdef
```

# About

A useful util library for writing shell script stream processing using
[dsherret/dax](https://github.com/dsherret/dax).

## Quick example

```typescript
import $ from "https://raw.githubusercontent.com/impactaky/dax_extras/main/mod.ts";

const stream = $`echo "abc\nabcde\nabcdef\nbcdefg"`
  .map((l) => `bug : ${l}`)
  .$(`grep 'bug : a'`)
  .filter((l) => l.length > "bug : ".length + 5);
for await (const line of stream) {
  console.log(`de${line}`);
}
// => debug : abcdef
```

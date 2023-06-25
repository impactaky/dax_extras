# About

A useful util library for writing shell script stream processing using
[dsherret/dax](https://github.com/dsherret/dax).

## Quick example

```typescript
const stream = $`echo "abc\nabcde\nabcdef\nbcdefg"`
  .map((l) => {
    return `bug : ${l}`;
  })
  .$(`grep 'bug : a'`)
  .filter((l) => {
    return l.length > "bug : ".length + 5;
  });
for await (const line of stream) {
  console.log(`de${line}`);
}
// => debug : abcdef
```

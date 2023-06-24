# About 

A useful util library for writing shell script stream processing using [dsherret/dax](https://github.com/dsherret/dax).

## Quick example

```typescript
const stream = $`echo "abc\nabcde\nabcdef\nbcdefg"`
           .map(l => { return `bug : ${l}`; })
           .$(`grep 'bug : a'`)
           .map(l => { return `de${l}`; })
           .filter(l => { return l.length > "debug : ".length + 5; })
            ;
for await (const line of stream) {
    console.log(line);
}
// => debug : abcdef
```

import fs from "fs";
import nReadlines from "n-readlines";

async function main() {
  const input = "src/util/indexer.txt";
  const output = "src/util/indexer-out.txt";
  // const input = "src/util/seepass.txt";
  // const output = "src/util/seepass-out.txt";

  const keys: number[] = [];
  const values: Map<number, string> = new Map();

  const liner = new nReadlines(input);
  let line;
  while ((line = liner.next())) {
    // console.log(line.toString());

    if (line.toString().trim().length == 0) {
      break;
    }

    const [key, value] = line.toString().split(":");
    // console.log(key, " ~~~~ ", value)

    keys.push(Number(key.toString().trim()));
    values.set(Number(key), value.trim());
  }

  const result = keys.sort((n1, n2) => n1 - n2);
  console.log(result);

  for (const k of result) {
    fs.writeFileSync(output, `${k}:${values.get(k) as string}\n`, {
      flag: "a+",
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

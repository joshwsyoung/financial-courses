/** Re-serialise YAML files in a consistent style. Usage: tsx scripts/format-yaml.ts <files...> */
import fs from "node:fs";
import YAML from "yaml";

for (const file of process.argv.slice(2)) {
  const doc = YAML.parse(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, YAML.stringify(doc, { lineWidth: 110, nullStr: "null" }));
}

// Bumps the version in package.json AND public/manifest.json together.
//   node scripts/bump-version.mjs patch | minor | major | 1.4.2
// The stores require a higher manifest version for every upload, and
// scripts/package.mjs refuses to build a zip when the two files disagree.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = [join(root, "package.json"), join(root, "public", "manifest.json")];
const arg = process.argv[2] ?? "patch";

const pkg = JSON.parse(readFileSync(files[0], "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

let next;
if (arg === "major") next = `${major + 1}.0.0`;
else if (arg === "minor") next = `${major}.${minor + 1}.0`;
else if (arg === "patch") next = `${major}.${minor}.${patch + 1}`;
else if (/^\d+\.\d+\.\d+$/.test(arg)) next = arg;
else {
  console.error(`Usage: bump-version.mjs patch|minor|major|x.y.z (got "${arg}")`);
  process.exit(1);
}

for (const file of files) {
  const json = JSON.parse(readFileSync(file, "utf8"));
  json.version = next;
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
}
console.log(`Version ${pkg.version} → ${next} (package.json + public/manifest.json)`);

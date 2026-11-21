// Zips dist/ into release/focusflow-<version>.zip — the file to upload to the
// Chrome Web Store and Microsoft Edge Add-ons. Runs automatically after
// `npm run build`.
//
// Uses fflate (pure JS) instead of OS zip tools: Windows PowerShell's
// Compress-Archive writes backslash paths, which the stores reject.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { zipSync } from "fflate";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const outDir = join(root, "release");

function fail(message) {
  console.error(`\n✖ package: ${message}\n`);
  process.exit(1);
}

if (!existsSync(join(dist, "manifest.json"))) fail("dist/manifest.json not found — run the Vite build first.");

const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (manifest.version !== pkg.version) {
  fail(`version mismatch: manifest ${manifest.version} vs package.json ${pkg.version}. Run "npm run version:patch" (or minor/major).`);
}

// Files Chrome adds to unpacked extensions, or that never belong in a store upload.
const EXCLUDE = [/^_metadata\//, /\.map$/, /(^|\/)\.DS_Store$/, /(^|\/)Thumbs\.db$/];

const files = {};
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(dist, full).split(sep).join("/"); // always forward slashes
    if (statSync(full).isDirectory()) walk(full);
    else if (!EXCLUDE.some((re) => re.test(rel))) files[rel] = readFileSync(full);
  }
})(dist);

// Stable timestamps make the zip reproducible.
const zipped = zipSync(
  Object.fromEntries(Object.entries(files).map(([name, data]) => [name, [data, { mtime: new Date("2020-01-01T00:00:00Z") }]])),
  { level: 9 }
);

mkdirSync(outDir, { recursive: true });
// Keep release/ tidy: only the current version's zip.
for (const name of readdirSync(outDir)) {
  if (/^focusflow-.*\.zip$/.test(name)) rmSync(join(outDir, name));
}
const outFile = join(outDir, `focusflow-${manifest.version}.zip`);
writeFileSync(outFile, zipped);

const kb = (zipped.length / 1024).toFixed(0);
console.log(`\n✔ release/focusflow-${manifest.version}.zip  (${Object.keys(files).length} files, ${kb} KB)`);

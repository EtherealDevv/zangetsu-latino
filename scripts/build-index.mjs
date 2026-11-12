// Builds index.json from every extension's mangayomiSources block.
// usage: node scripts/build-index.mjs [baseUrl]
//   baseUrl defaults to the GitHub raw URL of this repo (edit OWNER/REPO below).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_BASE = "https://raw.githubusercontent.com/IDRIS/mangayomi-latino-extensions/main";
const base = (process.argv[2] || process.env.REPO_BASE || DEFAULT_BASE).replace(/\/+$/, "");

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
}
walk(path.join(ROOT, "javascript"));

const index = [];
const seen = new Set();

for (const file of files.sort()) {
  const code = fs.readFileSync(file, "utf8");
  const m = code.match(/const mangayomiSources\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!m) {
    console.log(`skip (no mangayomiSources): ${path.relative(ROOT, file)}`);
    continue;
  }
  let sources;
  try {
    sources = new Function(`return ${m[1]};`)();
  } catch (e) {
    console.log(`skip (bad sources): ${path.relative(ROOT, file)} :: ${e.message}`);
    continue;
  }
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  for (const src of sources) {
    if (seen.has(src.id)) throw new Error(`duplicate id ${src.id} (${src.name})`);
    seen.add(src.id);
    index.push({
      name: src.name,
      id: src.id,
      baseUrl: src.baseUrl,
      lang: src.lang || "es",
      typeSource: src.typeSource || "single",
      iconUrl: src.iconUrl || "",
      dateFormat: src.dateFormat || "",
      dateFormatLocale: src.dateFormatLocale || "",
      isNsfw: !!src.isNsfw,
      hasCloudflare: !!src.hasCloudflare,
      sourceCodeUrl: `${base}/${rel}`,
      apiUrl: "",
      version: src.version || "0.1.0",
      isManga: false,
      itemType: src.itemType ?? 1,
      isFullData: !!src.isFullData,
      appMinVerReq: src.appMinVerReq || "0.5.0",
      additionalParams: src.additionalParams || "",
      sourceCodeLanguage: 1,
      notes: src.notes || "",
    });
  }
}

fs.writeFileSync(path.join(ROOT, "index.json"), JSON.stringify(index, null, 2) + "\n");
if (!fs.existsSync(path.join(ROOT, "repo.json"))) {
  fs.writeFileSync(path.join(ROOT, "repo.json"), JSON.stringify({ name: "Latino Pirate Extensions", website: base }, null, 2) + "\n");
}
console.log(`index.json: ${index.length} sources from ${files.length} files`);
console.log(`base: ${base}`);

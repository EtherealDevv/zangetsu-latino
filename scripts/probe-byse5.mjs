// byse: nombres de operación que la SPA pasa a Gv (operation: "...").
import fs from "node:fs";
const b = fs.readFileSync(".sfref/byse-bundle.js", "utf8");
console.log("bundle", b.length + "b");

const ops = [...new Set([...b.matchAll(/operation\s*:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]))];
console.log("\noperation:", ops.join("  ") || "-");

const alt = [...new Set([...b.matchAll(/["'`]([a-z][a-z0-9/_-]{2,30})["'`]/g)].map((m) => m[1]))]
  .filter((s) => /\//.test(s) || /^(video|embed|player|stream|resolve|watch|media)/.test(s));
console.log("\ncandidatos con /:", alt.slice(0, 60).join("  "));

// el objeto de peticiones del player
for (const k of ["operation:", "useQuery", "queryKey", "namespace"]) {
  let i = -1, n = 0;
  while ((i = b.indexOf(k, i + 1)) >= 0 && n < 4) {
    console.log(`\n[${k} @${i}]`, b.slice(Math.max(0, i - 300), i + 400).replace(/\s+/g, " "));
    n++;
  }
}

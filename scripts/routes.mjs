const url = process.argv[2];
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
console.log("status", res.status, "len", html.length, "final", res.url);
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
const counts = new Map();
for (const h of hrefs) {
  const base = h.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const seg = base.split("/").filter(Boolean).slice(0,2).join("/");
  counts.set("/"+seg, (counts.get("/"+seg)||0)+1);
}
console.log("\n== href prefixes");
for (const [k,v] of [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,25)) console.log(`  ${String(v).padStart(3)} ${k}`);
console.log("\n== api-ish strings");
for (const p of ["/api/","fetch(","axios","__NEXT_DATA__","data-page","application/json","directorio","wp-json","/ajax/","graphql"]) {
  const c = (html.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"))||[]).length;
  if (c) console.log(`  ${p} x${c}`);
}
const idx = html.indexOf("/api/");
if (idx>=0) console.log("\nctx:", html.slice(Math.max(0,idx-300), idx+400).replace(/\s+/g," "));

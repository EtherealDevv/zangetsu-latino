// Rutas del API que consume la app de AnimeLatinoHD: buscar api.get("...") en el repo.
import fs from "node:fs";

const KEY = process.env.GH_TOKEN || "";
const h = { "User-Agent": "curl", "Accept": "application/vnd.github+json" };
if (KEY) h.Authorization = "Bearer " + KEY;

const q = 'repo:Animelatino/animes "api.get("';
const r = await fetch("https://api.github.com/search/code?q=" + encodeURIComponent(q) + "&per_page=30", { headers: h });
const j = await r.json();
console.log("search:", r.status, "total:", j.total_count);
const paths = (j.items || []).map((x) => x.path);
console.log(paths.join("\n"));

const routes = new Set();
for (const p of paths.slice(0, 12)) {
  const raw = await fetch("https://raw.githubusercontent.com/Animelatino/animes/master/" + p, { headers: { "User-Agent": "curl" } });
  const txt = await raw.text();
  for (const m of txt.matchAll(/api\.get\(\s*[`'"]([^`'"]+)/g)) routes.add(m[1]);
  for (const m of txt.matchAll(/api\.post\(\s*[`'"]([^`'"]+)/g)) routes.add("POST " + m[1]);
}
console.log("\nrutas:", [...routes].join("\n  ") || "-");

const u = "https://jkanime.net/one-piece/";
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135" } });
const h = await r.text();
for (const needle of ["ajax/episodes", "var anime", "anime_id", "var eps"]) {
  let i = h.indexOf(needle);
  console.log("###", needle, i);
  if (i >= 0) console.log(h.slice(Math.max(0, i - 900), i + 700).replace(/\s+/g, " "));
}

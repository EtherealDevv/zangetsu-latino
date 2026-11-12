const u = "https://jkanime.net/naruto/1/";
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135" } });
const h = await r.text();
for (const needle of ["var video", "var remote", "var servers", "var episodes"]) {
  const i = h.indexOf(needle);
  console.log("###", needle, i);
  if (i >= 0) console.log(h.slice(i, i + 900).replace(/\s+/g, " "));
}

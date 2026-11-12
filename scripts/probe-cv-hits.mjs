const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
// 1) what does streamwish's 452-byte stub actually say?
const r = await fetch("https://streamwish.to/e/u9z952qli5mi", { headers: H, redirect: "follow" });
console.log("streamwish", r.status, r.url);
console.log((await r.text()).replace(/\s+/g, " ").slice(0, 460));
// 2) all Los Simpson hits on Cuevana, with their first episode mirror set
const sr = await fetch("https://wv3.cuevana3.eu/search?q=Los%20Simpson", { headers: H });
const b = await sr.text();
const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
const pp = JSON.parse(m[1]).props.pageProps;
const arr = pp.search || pp.results || [];
console.log("\nresultados:", arr.length);
for (const x of arr) {
  const t = (x.titles && x.titles.name) || x.name;
  const u = (x.url && (x.url.slug ? x.url.slug.name : x.url.slug)) || "";
  const kind = (x.url && x.url.slug && x.url.slug.season !== undefined) ? "ep" : (x.type || "");
  console.log(" -", String(t).slice(0, 44).padEnd(46), String(kind).padEnd(6), JSON.stringify(x.url && x.url.slug).slice(0, 60));
}

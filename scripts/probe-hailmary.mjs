const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const probeCC = async (q) => {
  const r = await fetch("https://www.cinecalidad.am/?s=" + encodeURIComponent(q), { headers: H });
  const b = await r.text();
  const inTitle = (b.match(/in_title/g) || []).length;
  const titles = [...b.matchAll(/class="in_title"[^>]*>([\s\S]*?)<\/div>/g)].map(m => m[1].replace(/<[^>]+>/g,"").trim());
  console.log("CC  " + q.padEnd(24), "in_title=" + inTitle, titles.slice(0,4).join(" | "));
};
const probeCV = async (q) => {
  const r = await fetch("https://wv3.cuevana3.eu/search?q=" + encodeURIComponent(q), { headers: H });
  const b = await r.text();
  const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  let n = 0, names = [];
  if (m) { try { const pp = JSON.parse(m[1]).props.pageProps; const arr = pp.search || pp.results || pp.data || []; n = arr.length; names = arr.slice(0,4).map(x => x.titles && x.titles.name || x.name); } catch(e) {} }
  console.log("CV  " + q.padEnd(24), "results=" + n, names.join(" | "));
};
for (const q of ["Project Hail Mary", "Proyecto Hail Mary", "hail mary", "Proyecto"]) await probeCC(q);
for (const q of ["Project Hail Mary", "Proyecto Hail Mary", "hail"]) await probeCV(q);

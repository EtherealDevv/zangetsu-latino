// puente de titulos localizados: TMDB (sin key) y Wikipedia es, para "En tu mejor momento".
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const strip = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const tmdb = async (q) => {
  const u = "https://www.themoviedb.org/search?query=" + encodeURIComponent(q) + "&language=es-MX";
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-MX,es;q=0.9" }, signal: AbortSignal.timeout(20000) });
    const t = await r.text();
    console.log(`\nTMDB "${q}" -> ${r.status} ${t.length}b`);
    const cards = [...t.matchAll(/<div class="card v4 tight">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g)].map((m) => m[1]);
    console.log("  cards:", cards.length);
    cards.slice(0, 6).forEach((c, i) => {
      const title = strip((c.match(/<h2>([\s\S]*?)<\/h2>/i) || [])[1] || "");
      const orig = strip((c.match(/<span class="original_title">([\s\S]*?)<\/span>/i) || [])[1] || "");
      const year = strip((c.match(/<span class="release_date">([\s\S]*?)<\/span>/i) || [])[1] || "");
      console.log(`  ${i + 1}. ${title}  ||  ${orig}  ||  ${year}`);
    });
    if (!cards.length) console.log("  head:", t.slice(0, 200).replace(/\s+/g, " "));
    return t;
  } catch (e) { console.log(`\nTMDB "${q}" ERR`, String(e.cause?.code || e.message).slice(0, 60)); return ""; }
};

const wiki = async (q) => {
  const u = "https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(q) + "&srlimit=5&format=json&origin=*";
  try {
    const r = await fetch(u, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    const hits = (j && j.query && j.query.search) || [];
    console.log(`\nWikipedia "${q}" -> ${r.status} ${hits.length}`);
    hits.slice(0, 5).forEach((h, i) => console.log(`  ${i + 1}. ${strip(h.title)} | ${strip(h.snippet).slice(0, 90)}`));
  } catch (e) { console.log(`\nWikipedia "${q}" ERR`, String(e.message).slice(0, 60)); }
};

await tmdb("En tu mejor momento");
await tmdb("En tu temporada más brillante");
await wiki("En tu mejor momento");
await wiki("In Your Radiant Season");

// exact-match por String en el filtro de Mongoke
const API = "https://sv1.fluxcedene.net/api/gql";
const SITE = "https://doramasflix.in";
const gql = async (op, vars, query) => {
  const r = await fetch(API, {
    method: "POST",
    headers: { "User-Agent": UA, "Accept": "application/json, text/plain, */*", "Content-Type": "application/json", "Origin": SITE, "Referer": SITE + "/", "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "", "x-access-platform": "doramasflix" },
    body: JSON.stringify({ operationName: op, variables: vars, query }), signal: AbortSignal.timeout(20000),
  });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch (e) {}
  if (!j || j.errors) console.log(`  [${op}] err:`, (j && j.errors && j.errors[0] && j.errors[0].message || t.slice(0, 100)));
  return j && j.data;
};
for (const v of ["In Your Radiant Season", "En tu temporada más brillante", "in your radiant season"]) {
  const d = await gql("eq", {}, `query eq { paginationDorama(page: 1, perPage: 5, filter: {name: "${v}"}) { items { name name_es slug } } }`);
  const it = (d && d.paginationDorama && d.paginationDorama.items) || [];
  console.log(`\nfilter name="${v}" -> ${it.length ? it.map((x) => x.name + " | " + x.name_es).join(" · ") : "(0)"}`);
}
for (const v of ["En tu temporada más brillante", "En tu mejor momento"]) {
  const d = await gql("eq", {}, `query eq { paginationDorama(page: 1, perPage: 5, filter: {name_es: "${v}"}) { items { name name_es slug } } }`);
  const it = (d && d.paginationDorama && d.paginationDorama.items) || [];
  console.log(`filter name_es="${v}" -> ${it.length ? it.map((x) => x.name + " | " + x.name_es).join(" · ") : "(0)"}`);
}

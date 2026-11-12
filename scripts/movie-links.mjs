const url = process.argv[2];
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
const pp = JSON.parse(m[1]).props.pageProps;
const movie = pp.thisMovie || pp.thisSerie || pp.thisTv || null;
console.log("pp keys:", Object.keys(pp).join(","));
console.log("movie keys:", Object.keys(movie).join(","));
for (const k of Object.keys(movie)) {
  const s = JSON.stringify(movie[k]);
  if (/download|link|player|stream|server|episode|season|chapter|url/i.test(k)) console.log(`\n## ${k}:`, (s||"").slice(0,2500));
}

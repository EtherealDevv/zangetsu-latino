const url = process.argv[2];
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if(!m){console.log("no next data");process.exit(0)}
const pp = JSON.parse(m[1]).props.pageProps;
console.log("pp keys:", Object.keys(pp).join(","));
for (const k of Object.keys(pp)) {
  if (/movie|serie|tv|episode|season|this/i.test(k)) {
    const v = pp[k];
    console.log(`\n## ${k}: array=${Array.isArray(v)} len=${JSON.stringify(v||"").length}`);
    if (Array.isArray(v)) console.log(JSON.stringify(v[0]).slice(0,2000));
    else if (v) { console.log("keys:", Object.keys(v).join(",")); for (const kk of Object.keys(v)) if (/video|download|episode|season|link/i.test(kk)) console.log(`  ${kk}:`, JSON.stringify(v[kk]).slice(0,1800)); }
  }
}

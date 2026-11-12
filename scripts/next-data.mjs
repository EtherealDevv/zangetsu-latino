const url = process.argv[2];
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (!m) { console.log("no next data"); process.exit(0); }
const d = JSON.parse(m[1]);
const pp = d.props.pageProps;
console.log("keys:", Object.keys(pp).join(", "));
for (const k of Object.keys(pp)) {
  const v = pp[k];
  const s = JSON.stringify(v);
  console.log(`\n## ${k}  (${Array.isArray(v) ? "array "+v.length : typeof v})  len=${s ? s.length : 0}`);
  if (s && s.length < 3000) console.log(s);
  else if (Array.isArray(v) && v.length) console.log(JSON.stringify(v[0]).slice(0,1500));
  else if (s) console.log(s.slice(0,1000));
}

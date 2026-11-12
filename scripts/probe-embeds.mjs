// Dump real embed pages so resolvers can be written against live markup.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

async function get(url, ref) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Referer": ref || url, "Accept-Language": "es-419,es;q=0.9" } });
  return { body: await r.text(), url: r.url, status: r.status };
}

function pageProps(html) {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]).props.pageProps; } catch { return null; }
}

const epUrl = process.argv[2] || "https://wv3.cuevana3.eu/episodio/merry-berry-love-temporada-1-episodio-6";
const page = await get(epUrl);
console.log("page", page.status, page.body.length);
const pp = pageProps(page.body);
const node = pp && (pp.thisMovie || pp.episode);
console.log("videos keys", node && node.videos ? Object.keys(node.videos) : null);

const seen = new Set();
for (const lang of ["latino", "spanish", "english", "japanese"]) {
  for (const e of (node?.videos?.[lang] || [])) {
    if (!e.result) continue;
    if (!/player\./.test(e.result)) continue;
    const p = await get(e.result, epUrl);
    const m = p.body.match(/var url = ['"]([^'"]+)['"]/);
    if (!m) { console.log(`\n== ${lang} ${e.quality} :: NO URL`); continue; }
    const embed = m[1];
    if (seen.has(embed)) continue;
    seen.add(embed);
    const eh = (embed.match(/https?:\/\/([^/]+)/) || [])[1] || "";
    console.log(`\n== ${lang} ${e.quality} -> ${eh}`);
    const eb = await get(embed, epUrl);
    const body = eb.body;
    console.log(`   status=${eb.status} len=${body.length} final=${eb.url}`);
    console.log("   eval(p,a,c,k,e,d):", /eval\(function\(p,a,c,k,e,d\)/.test(body));
    console.log("   pass_md5:", body.indexOf("pass_md5") >= 0);
    console.log("   m3u8 hits:", (body.match(/[^"'\\ ]+\.m3u8[^"'\\ ]*/g) || []).slice(0, 3));
    if (body.length < 2600) console.log("   BODY:", body.replace(/\s+/g, " "));
    else console.log("   head:", body.replace(/\s+/g, " ").slice(0, 500));
  }
}

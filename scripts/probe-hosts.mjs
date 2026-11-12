// Classify the embed hosts each site still offers, and what each embed serves.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

async function get(url, ref) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Referer": ref || url, "Accept-Language": "es-419,es;q=0.9" },
      redirect: "follow",
    });
    return { body: await r.text(), url: r.url, status: r.status };
  } catch (e) {
    return { body: "", url, status: 0, err: String(e.cause?.code || e.message) };
  }
}

function b64(s) {
  try { return Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); } catch { return ""; }
}

async function classify(embed) {
  const host = (embed.match(/https?:\/\/([^/]+)/) || [])[1] || "?";
  const r = await get(embed, "https://tioanime.com/");
  const b = r.body || "";
  const flags = [];
  if (/eval\(function\(p,a,c,k,e,d\)/.test(b)) flags.push("packer");
  if (b.indexOf("pass_md5") >= 0) flags.push("pass_md5");
  if (/altcha/i.test(b)) flags.push("altcha");
  if (/Just a moment|challenges\.cloudflare/i.test(b)) flags.push("cf");
  if (/\.m3u8/.test(b)) flags.push("m3u8");
  if (/\.mp4/.test(b)) flags.push("mp4");
  if (/window\.location\.href = '/.test(b) && !/altcha/i.test(b)) flags.push("redirect");
  console.log(`  ${host.padEnd(28)} status=${r.status} len=${b.length} ${flags.join(",") || "-"}`);
  if (b.length < 400) console.log(`     ${b.replace(/\s+/g, " ")}`);
  return { host, body: b, embed };
}

// TioAnime: var videos on an episode page
const tio = await get("https://tioanime.com/ver/demons-crest-1");
const tv = tio.body.match(/var videos\s*=\s*(\[[\s\S]*?\]);/);
console.log("tio videos:", tv ? tv[1].slice(0, 300) : "none");
let tioEmbeds = [];
if (tv) {
  try {
    const arr = JSON.parse(tv[1]);
    tioEmbeds = arr.map((v) => v.code || v.url || v.link).filter(Boolean).map((u) => (String(u).startsWith("//") ? "https:" + u : u)).map((u) => u.replace(/\\\//g, "/"));
  } catch (e) { console.log("tio parse fail", e.message); }
}
console.log("tio embeds:", tioEmbeds);

// MonosChinos: players in .srv[data-player]
const mono = await get("https://monoschinos.st/anime/gensou-suikoden-sub-espanol");
const ep = (mono.body.match(/href="([^"]*episodio[^"]*)"/) || [])[1];
console.log("\nmono ep:", ep);
if (ep) {
  const pg = await get(ep.startsWith("http") ? ep : "https://monoschinos.st" + ep);
  const players = [...pg.body.matchAll(/data-player="([^"]+)"/g)].map((m) => b64(m[1])).filter(Boolean);
  console.log("mono players:", players);
  for (const e of players.slice(0, 6)) if (/^https?:/.test(e)) await classify(e);
}

// JKAnime: var servers (base64 remote)
const jk = await get("https://jkanime.net/one-piece/1180/");
const sv = jk.body.match(/var servers\s*=\s*(\[[\s\S]*?\]);/);
let jkEmbeds = [];
if (sv) {
  try { jkEmbeds = JSON.parse(sv[1]).map((s) => b64(s.remote)).filter((u) => /^https?:/.test(u)); } catch {}
}
const vids = [...jk.body.matchAll(/video\[\d+\]\s*=\s*'([^']+)'/g)].map((m) => m[1]);
console.log("\njk embeds:", jkEmbeds, "\njk video[]:", vids);
for (const e of [...jkEmbeds, ...vids]) if (/^https?:/.test(e)) await classify(e);

// CineCalidad: dooplay options
const cc = await get("https://www.cinecalidad.am/ver-pelicula/madre-siniestra/");
const opts = [...cc.body.matchAll(/data-option="([^"]+)"/g)].map((m) => m[1]);
console.log("\ncinecalidad options:", opts.length);

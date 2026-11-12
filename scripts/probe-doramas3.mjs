// Doramasflix pase 3: sacar todos los links de un episodio y ver qué host entrega mp4/m3u8 directo.
const API = "https://sv1.fluxcedene.net/api/gql";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = {
  "accept": "application/json, text/plain, */*", "content-type": "application/json",
  "origin": "https://doramasflix.in", "referer": "https://doramasflix.in/",
  "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==", "user-agent": UA
};
const gql = async (o, v, q) => {
  const r = await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) });
  return JSON.parse(await r.text());
};
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", err: String(e.cause?.code || e.message) }; }
};
const b64u = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

// dos títulos: un episodio latino y una película
const ep = await gql("getEpisodeLinks", { id: "614480f796deca380bd2c950" }, `query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { _id links_online } }`);
const links = ep.data.getEpisodeLinks.links_online;
const byLang = {};
for (const l of links) { const k = l.language_code + "/" + l.lang; byLang[k] = (byLang[k] || 0) + 1; }
console.log("total links:", links.length, "| por idioma:", JSON.stringify(byLang));
const hosts = {};
for (const l of links) { try { const h = new URL(l.embed || l.link).host; (hosts[h] = hosts[h] || []).push(l); } catch {} }
console.log("hosts:", Object.entries(hosts).map(([h, a]) => `${h}(${a.length})`).join(" "));

console.log("\n== muestra por host (es) ==");
for (const [h, arr] of Object.entries(hosts)) {
  const pick = arr.find((x) => x.language_code === "es") || arr[0];
  console.log(`  ${h.padEnd(22)} ${pick.lang} ${pick.subtitle_mode || "-"} ${(pick.embed || pick.link).slice(0, 78)}`);
}

// fkplayer: descifrar el JWT y ver si el payload ya trae el embed real
const fk = links.find((l) => /fkplayer/.test(l.embed || l.link));
if (fk) {
  const jw = (fk.embed || fk.link).split("/e/")[1];
  const payload = jw.split(".")[1];
  console.log("\nfkplayer JWT payload:", b64u(payload));
  const page = await get(fk.embed || fk.link);
  console.log("  page", page.s, page.b.length + "b");
  const tok = (page.b.match(/"token"\s*:\s*"([^"]+)"/) || [])[1];
  console.log("  token:", tok ? tok.slice(0, 40) : "-");
  if (tok) {
    const d = await fetch("https://fkplayer.xyz/api/decoding", { method: "POST", headers: { "content-type": "application/json", "user-agent": UA, origin: "https://fkplayer.xyz" }, body: JSON.stringify({ token: tok }), signal: AbortSignal.timeout(20000) });
    const t = await d.text();
    console.log("  decoding", d.status, t.slice(0, 300));
    try { const j = JSON.parse(t); if (j.link) console.log("  => link:", Buffer.from(j.link, "base64").toString().slice(0, 140)); } catch {}
  }
}

// resolver candidato: primeload
const pl = links.find((l) => /primeload/.test(l.embed || l.link));
if (pl) {
  const u = pl.embed || pl.link;
  const r = await get(u, { referer: "https://doramasflix.in/" });
  console.log(`\nprimeload ${r.s} ${r.b.length}b ${u}`);
  const m = r.b.match(/https?:[^"'\s\\]+\.(?:m3u8|mp4)[^"'\s\\]*/i);
  console.log("  directo:", m ? m[0].slice(0, 120) : "no");
  console.log("  ctx:", r.b.replace(/\s+/g, " ").slice(0, 400));
}

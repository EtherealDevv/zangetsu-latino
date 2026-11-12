// Los Simpson on Cuevana3: what mirrors do the episode pages list, and which
// of them actually answer from this network?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const BASE = "https://wv3.cuevana3.eu";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow" });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause && e.cause.code || e.message) }; }
};
const pp = (b) => {
  const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]).props.pageProps; } catch { return null; }
};

const serie = await get(BASE + "/ver-serie/los-simpson");
const node = pp(serie.b) && (pp(serie.b).thisSerie || pp(serie.b).thisMovie);
const seasons = (node && node.seasons) || [];
const eps = [];
for (const s of seasons) for (const e of (s.episodes || [])) eps.push(e);
console.log("seasons:", seasons.length, "| eps:", eps.length);

const pick = [eps[0], eps[1], eps[eps.length - 3]];
for (const ep of pick) {
  const sl = ep.slug || {};
  const url = BASE + "/episodio/" + sl.name + "-temporada-" + sl.season + "-episodio-" + sl.episode;
  const page = await get(url);
  const epp = pp(page.b);
  const en = epp && (epp.episode || epp.thisSerie || epp.thisMovie);
  const videos = en && en.videos;
  console.log("\n" + url);
  console.log("  page:", page.s, "| title:", ep.title, "| langs:", videos ? Object.keys(videos).join(",") : "none");
  if (!videos) continue;
  const entries = [];
  for (const lang of Object.keys(videos)) for (const e of videos[lang] || []) if (e && e.result) entries.push({ lang, locker: e.cyberlocker || "?", quality: e.quality || "", result: e.result });
  for (const e of entries) {
    const pl = await get(e.result, { Referer: url });
    const m = pl.b.match(/var url\s*=\s*['"]([^'"]+)['"]/i);
    if (!m) { console.log(`  ${e.lang.padEnd(8)} ${e.locker.padEnd(12)} q=${e.quality.padEnd(4)} player ${pl.s} len=${pl.b.length} -> sin var url`); continue; }
    const embed = m[1].replace(/\\\//g, "/");
    const host = (embed.match(/^(https?:\/\/[^/]+)/) || [])[1] || "";
    const code = embed.split("?")[0].split("/").filter(Boolean).pop();
    let apiTxt = "-";
    try {
      const r = await fetch(host + "/api/stream", {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Origin: host, Referer: host + "/e/" + code },
        body: JSON.stringify({ filecode: code, device: "android", codecs: { av1: "av01.0.09M.10", h265: "hvc1.1.6.L123.B0" } })
      });
      const t = await r.text();
      try { const j = JSON.parse(t); apiTxt = j.streaming_url ? "API OK " + j.streaming_url.slice(0, 45) : "API " + r.status + " sin url"; }
      catch { apiTxt = "API " + r.status + " " + t.replace(/\s+/g, " ").slice(0, 40); }
    } catch (err) { apiTxt = "API ERR " + String(err.cause && err.cause.code || err.message); }
    const pg = await get(embed);
    console.log(`  ${e.lang.padEnd(8)} ${e.locker.padEnd(12)} q=${e.quality.padEnd(4)} page=${String(pg.s).padEnd(3)} len=${String(pg.b.length).padEnd(6)} ${apiTxt}`);
  }
}

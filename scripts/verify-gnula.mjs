const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

console.log("### m3u8 de gnulahd (dos idiomas)");
const page = await get("https://ww3.gnulahd.nu/ver/godzilla-minus-zero/");
const pid = (page.b.match(/_gnrdPid\s*=\s*(\d+)/) || [])[1];
const tok = (page.b.match(/_gnrdTok\s*=\s*"([^"]*)"/) || [])[1];
const api = await get(`https://ww3.gnulahd.nu/wp-json/gnrd/v1/player?id=${pid}&t=${tok}`, { Referer: page.u });
const payload = JSON.parse(api.b).p;
const bytes = Buffer.from(payload, "base64");
const key = [103, 78, 55, 100];
const out = Buffer.alloc(bytes.length);
for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i & 3];
const data = JSON.parse(out.toString("utf8"));
for (const lang of data.langs) {
  for (const s of lang.servers) {
    const u = s.src.replace(/#.*$/, "");
    if (/voe\.|savefiles|dood|streamtape/i.test(u)) { console.log(`  ${lang.label.padEnd(12)} ${u.slice(0, 60)} SALTA (host muerto)`); continue; }
    const host = (u.match(/^(https?:\/\/[^/]+)/) || [])[1];
    const code = u.split("?")[0].split("/").filter(Boolean).pop();
    const r = await fetch(host + "/api/stream", {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json", Origin: host, Referer: host + "/e/" + code },
      body: JSON.stringify({ filecode: code, device: "android", codecs: { av1: "av01.0.09M.10", h265: "hvc1.1.6.L123.B0" } }),
      signal: AbortSignal.timeout(15000)
    }).catch((e) => ({ status: 0, err: e }));
    let d = null;
    try { d = JSON.parse(await r.text()); } catch (e) { d = null; }
    const su = d && d.streaming_url;
    console.log(`  ${lang.label.padEnd(12)} ${host.slice(0, 24).padEnd(26)} ${su ? "OK" : "sin stream"} ${su ? su.slice(0, 58) : ""}`);
    if (su) {
      const m = await get(su, { Referer: host + "/" });
      console.log(`     master ${m.s} ${m.b.length}b ${m.b.startsWith("#EXTM3U") ? "EXTM3U" : m.b.slice(0, 40)}`);
    }
  }
}

console.log("\n### búsquedas de control en gnulahd");
for (const q of ["naruto", "avatar", "the simpsons", "dune"]) {
  const r = await get("https://ww3.gnulahd.nu/?s=" + encodeURIComponent(q));
  const cards = [...r.b.matchAll(/<a class="gnrd-card"[^>]*href="([^"]+)"[^>]*title="([^"]*)"/gi)].map((m) => m[2]);
  console.log(`  ${q.padEnd(14)} ${cards.length} tarjetas: ${cards.slice(0, 4).join(" | ")}`);
}

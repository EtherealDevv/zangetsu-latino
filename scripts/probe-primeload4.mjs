// Primeload: de dónde sale el token que firma el m3u8 del CDN.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, referer: "https://primeload.co/", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const js = await get("https://primeload.co/player-dist/assets/index-d_Oc1EoW.js");
const b = js.b;
for (const k of ["master_manifest", "Token validation", "signature", "signed", "expires", "playback", "cdn_nodes", "token=", "?t="]) {
  let i = -1, n = 0;
  while ((i = b.indexOf(k, i + 1)) > 0 && n < 3) {
    console.log(`\n[${k}] @${i}:`, b.slice(Math.max(0, i - 220), i + 260).replace(/\s+/g, " "));
    n++;
  }
}

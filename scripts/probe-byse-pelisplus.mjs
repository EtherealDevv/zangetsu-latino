// Dos frentes: API del bundle byse (clones streamwish) y estructura de series en PelisPlus.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

console.log("### BYSE bundle");
const js = await get("https://bysefujedu.com/assets/index-DocunfmE.js", { referer: "https://bysefujedu.com/e/f2rwhq07ydg3" });
console.log("bundle", js.s, js.b.length + "b");
const urls = [...new Set([...js.b.matchAll(/["'`](https?:\/\/[a-z0-9.-]+\/[a-z0-9/_.-]{0,40})["'`]/gi)].map((m) => m[1]))].filter((u) => !/w3\.org|github|npmjs|reactjs|fonts|cloudflare|googleapis|schema|polyfill/i.test(u));
console.log("urls:", urls.slice(0, 14).join("\n       ") || "-");
const paths = [...new Set([...js.b.matchAll(/["'`](\/(?:api|v1|v2|video|embed|stream|dl|load)[a-z0-9/_.-]{0,40})["'`]/gi)].map((m) => m[1]))];
console.log("paths:", paths.slice(0, 16).join("  ") || "-");
for (const k of ["/api/", "filecode", "X-API", "apikey", "api_key"]) {
  let i = -1, n = 0;
  while ((i = js.b.indexOf(k, i + 1)) >= 0 && n < 2) {
    console.log(`  [${k}]`, js.b.slice(Math.max(0, i - 150), i + 200).replace(/\s+/g, " "));
    n++;
  }
}

console.log("\n### PELISPLUS serie");
const PP = "https://pelisplus2.vip";
const s1 = await get(PP + "/serie/456-1/los-simpson/");
console.log("season page", s1.s, s1.b.length + "b");
const eps = [...new Set([...s1.b.matchAll(/href="([^"]*\/(?:serie|episodio|capitulo)\/[^"]+)"/gi)].map((m) => m[1]))];
console.log("links:", eps.length);
eps.slice(0, 8).forEach((e) => console.log("   ", e.slice(0, 110)));
const play = [...new Set([...s1.b.matchAll(/href="([^"]*play[^"]*)"/gi)].map((m) => m[1]))];
console.log("play:", play.slice(0, 5).join("  ") || "-");

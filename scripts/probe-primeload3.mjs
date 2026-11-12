// Primeload: qué pide el bundle a /api/v1 y si algo responde sin el challenge.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, referer: "https://primeload.co/", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const page = await get("https://primeload.co/player/R8dCbP0C8cFX?ref=https%3A%2F%2Fdoramasflix.in%2F");
const root = (page.b.match(/<div id="root"([^>]*)>/) || [])[1] || "";
console.log("root attrs:", root.replace(/\s+/g, " ").slice(0, 700));

const js = await get("https://primeload.co/player-dist/assets/index-d_Oc1EoW.js");
console.log("\nbundle", js.s, js.b.length + "b");
const paths = [...new Set([...js.b.matchAll(/["'`](\/api\/v1\/[a-z0-9/_.:{}$-]*)["'`]/gi)].map((m) => m[1]))];
console.log("api paths:", paths.join("  ") || "-");
const calls = [...new Set([...js.b.matchAll(/["'`](\/(?:api|player|embed|media|source)[a-z0-9/_.-]*)["'`]/gi)].map((m) => m[1]))].slice(0, 20);
console.log("otros:", calls.join("  "));
for (const k of ["pow", "proof", "challenge", "altcha", "nonce", "audio_fingerprint", "canvas"]) {
  const i = js.b.indexOf(k);
  if (i > 0) console.log(`  "${k}", ctx:`, js.b.slice(Math.max(0, i - 120), i + 180).replace(/\s+/g, " "));
}

// ¿algún endpoint contesta sin prueba?
const TOK = "R8dCbP0C8cFX";
const SES = (root.match(/data-session="([^"]+)"/) || [])[1] || "";
const H = { origin: "https://primeload.co", referer: "https://primeload.co/player/" + TOK, "accept": "application/json, text/plain, */*" };
const cands = [
  `/api/v1/video/${TOK}`, `/api/v1/stream/${TOK}`, `/api/v1/source/${TOK}`, `/api/v1/embed/${TOK}`,
  `/api/v1/player/${TOK}`, `/api/v1/token/${TOK}`, `/api/v1/session/${SES}`, `/api/v1/config`,
  `/api/v1/video?token=${TOK}`, `/api/v1/sources?token=${TOK}`, `/api/v1/media/${TOK}`
];
console.log("\ntanteo:");
for (const p of cands) {
  const r = await get("https://primeload.co" + p, H);
  console.log(`  ${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(6)} ${p.slice(0, 40).padEnd(42)} ${r.b.replace(/\s+/g, " ").slice(0, 90)}`);
}

// byse SPA: la tabla de endpoints del bundle.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const page = await get("https://bysesukior.com/e/2v6iszwffy2f", { referer: "https://cdn.tudorama.com/" });
const js = [...new Set([...page.b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((m) => m[1]))];
console.log("page", page.s, page.b.length + "b | js:", js.join(" "));
const bundle = js.find((x) => /assets\/index-.*\.js/.test(x));
const b = (await get("https://bysesukior.com" + bundle, { referer: page.u })).b;
console.log("bundle", b.length + "b");

// nombres usados por Gv(...)
const calls = [...new Set([...b.matchAll(/Gv\(\s*([^,)]{1,80})/g)].map((m) => m[1]))];
console.log("\nllamadas Gv:", calls.length);
calls.slice(0, 40).forEach((c) => console.log("   ", c.slice(0, 90)));

// variables tipo const Xx="..."; con nombres cortos y valores con pinta de endpoint
const cand = [...new Set([...b.matchAll(/[A-Za-z_$][\w$]{0,3}\s*=\s*`?["'`]([a-z][a-z0-9_/-]{2,30})["'`]/g)].map((m) => m[1]))]
  .filter((v) => /^(?:video|stream|file|embed|player|resolve|source|media|cdn|dl|download|link|fetch|hls|api|play)/.test(v));
console.log("\ncandidatos:", cand.join("  ") || "-");

// objeto de rutas
for (const k of ["={\"", ":{\"", "resolve\""]) {
  let i = -1, n = 0;
  while ((i = b.indexOf(k, i + 1)) >= 0 && n < 3) { console.log(`\n[${k}]`, b.slice(Math.max(0, i - 200), i + 400).replace(/\s+/g, " ")); n++; }
}

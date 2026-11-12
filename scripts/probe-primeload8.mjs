// Primeload: ¿hls.js añade alguna cabecera al pedir el m3u8?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const b = await (await fetch("https://primeload.co/player-dist/assets/index-d_Oc1EoW.js", { headers: { "user-agent": UA, referer: "https://primeload.co/" }, signal: AbortSignal.timeout(30000) })).text();
for (const k of ["xhrSetup", "setRequestHeader", "x-access", "Authorization", "headers:", "loadSource", "hls-", "ticket"]) {
  let i = -1, n = 0;
  while ((i = b.indexOf(k, i + 1)) >= 0 && n < 2) {
    console.log(`\n[${k}] @${i}`, b.slice(Math.max(0, i - 200), i + 240).replace(/\s+/g, " "));
    n++;
  }
}

// y probar el endpoint de sesión sin resolver el challenge
const post = async (p, body, extra) => {
  const r = await fetch("https://primeload.co/api/v1" + p, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": UA, origin: "https://primeload.co", referer: "https://primeload.co/player/R8dCbP0C8cFX", ...(extra || {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20000)
  });
  const t = await r.text();
  return { s: r.status, b: t, sc: r.headers.getSetCookie ? r.headers.getSetCookie() : [] };
};
const s1 = await post("/stream/session", { video_id: "R8dCbP0C8cFX" });
console.log("\n\nsession", s1.s, s1.b.slice(0, 400), "| cookies:", (s1.sc || []).map((c) => c.split(";")[0]).join(" "));
let sid = "";
try { sid = JSON.parse(s1.b).session_id || ""; } catch {}
if (sid) {
  const s2 = await post("/stream/attest", { session_id: sid, nonce: "x", responses: [], fingerprint: "abc" });
  console.log("attest(sin respuestas)", s2.s, s2.b.slice(0, 300));
}

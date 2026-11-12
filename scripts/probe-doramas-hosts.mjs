// Los hosts de Doramasflix uno por uno: fkplayer, streamtape, voe, mxdrop.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const b64u = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const dirs = (b) => [...new Set((b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/gi) || []))].slice(0, 3);

// --- fkplayer: /e/<jwt> -> token en __NEXT_DATA__ -> /api/decoding -> base64
const FK = "https://fkplayer.xyz/e/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsaW5rIjoiYUhSMGNITTZMeTl3Y21sdFpXeHZZV1F1WTI4dlpXMWlaV1F2VWpoa1EySlFNRU00WTBaWSIsInNlcnZlciI6IjQ3MjEiLCJpYXQiOjE3OTQ1MDA3NDQsImV4cCI6MTc5NDc1OTk0NH0.cgFxVnIb1wHnKYL3MPYiDMbC4ewHz0yDTY97oNthjr4";
console.log("=== FKPLAYER");
console.log("  payload JWT:", b64u(FK.split("/e/")[1].split(".")[1]));
const fk = await get(FK);
console.log("  page", fk.s, fk.b.length + "b");
const tok = (fk.b.match(/"token"\s*:\s*"([^"]+)"/) || [])[1];
console.log("  token:", tok ? tok.slice(0, 50) : "-");
if (tok) {
  const d = await fetch("https://fkplayer.xyz/api/decoding", { method: "POST", headers: { "content-type": "application/json", "user-agent": UA, origin: "https://fkplayer.xyz", referer: FK }, body: JSON.stringify({ token: tok }), signal: AbortSignal.timeout(20000) });
  const t = await d.text();
  console.log("  decoding", d.status, t.slice(0, 200));
  const j = JSON.parse(t || "{}");
  if (j.link) console.log("  => ", Buffer.from(j.link, "base64").toString().slice(0, 150));
}

// --- streamtape
console.log("\n=== STREAMTAPE");
const st = await get("https://streamtape.com/e/M0gJDOzzqXSma1x");
console.log("  page", st.s, st.b.length + "b");
const robot = st.b.match(/id="norobotlink"[^>]*>([\s\S]{0,400}?)<\/div>/);
console.log("  robotlink:", robot ? robot[1].replace(/\s+/g, " ").slice(0, 300) : "-");
const stm = st.b.match(/\/streamtape\.com\/get_video\?[^"'\s]+/);
console.log("  get_video:", stm ? stm[0].slice(0, 140) : (st.b.match(/get_video\?[^"'\s]+/) || [])[0] || "-");
console.log("  dirs:", dirs(st.b).join("  ") || "-");

// --- voe
console.log("\n=== VOE");
const voe = await get("https://voe.sx/e/mwbpei0wt18t");
console.log("  page", voe.s, voe.b.length + "b");
console.log("  dirs:", dirs(voe.b).join("  ") || "-");
const vj = (voe.b.match(/\{[^{}]*"source"\s*:\s*"[^"]+"[^{}]*\}/) || [])[0];
console.log("  json source:", vj ? vj.slice(0, 260) : "-");
const vctx = voe.b.search(/atob|rot13|source/);
console.log("  ctx:", vctx > 0 ? voe.b.slice(Math.max(0, vctx - 200), vctx + 500).replace(/\s+/g, " ") : "-");

// --- mxdrop (filemoon clon)
console.log("\n=== MXDROP");
const mx = await get("https://mxdrop.to/e/8lrpj336bkxp6x");
console.log("  page", mx.s, mx.b.length + "b");
console.log("  dirs:", dirs(mx.b).join("  ") || "-");
console.log("  packer:", /eval\(function\(p,a,c,k,e,d\)/.test(mx.b));
const mi = mx.b.search(/eval\(function|sources|file\s*:/);
console.log("  ctx:", mi > 0 ? mx.b.slice(Math.max(0, mi - 150), mi + 500).replace(/\s+/g, " ") : "-");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => (await fetch(u, { headers: H })).text();

function b64(s) {
  try { return Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); } catch { return ""; }
}

for (const url of ["https://jkanime.net/one-piece/1180/", "https://jkanime.net/one-piece/1/"]) {
  const h = await get(url);
  console.log(`\n=== ${url} len=${h.length}`);
  const sv = h.match(/var servers\s*=\s*(\[[\s\S]*?\]);/);
  console.log("servers raw:", sv ? sv[1].slice(0, 400) : "none");
  if (sv) {
    try {
      const arr = JSON.parse(sv[1]);
      console.log("servers decoded:", arr.map((s) => `${s.server || s.name || "?"} -> ${b64(s.remote || "").trim()}`));
    } catch (e) { console.log("parse fail", e.message); }
  }
  const vids = [...h.matchAll(/video\[(\d+)\]\s*=\s*'([^']+)'/g)].map((m) => m[2]);
  console.log("video[]:", vids);
  const iframes = [...h.matchAll(/<iframe[^>]*src="([^"]+)"/gi)].map((m) => m[1]);
  console.log("iframes:", iframes.slice(0, 6));
  console.log("variants:", [...new Set([...h.matchAll(/var\s+(\w+)\s*=\s*/g)].map((m) => m[1]))].filter((v) => /server|video|url|code/i.test(v)));
}

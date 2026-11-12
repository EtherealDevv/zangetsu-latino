// Los hosts latinos de Tudorama: hgcloud (streamwish), minochinos (earnvids), pixeldrain.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
function unpack(s) {
  s = String(s);
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, payload = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { payload += s[i + 1]; i += 2; continue; } if (c === "'") break; payload += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  const base = parseInt(m[1], 10), count = parseInt(m[2], 10);
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const d = rest[j]; if (d === "\\") { dict += rest[j + 1]; j += 2; continue; } if (d === "'") break; dict += d; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let out = payload;
  for (let k = count - 1; k >= 0; k--) if (words[k]) out = out.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return out;
}
const dir = (b) => {
  const m = b.match(/["'](?:file|src|source|hls[2-4])["']?\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i)
    || b.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/i);
  return m ? String(m[1] || m[0]).replace(/\\\//g, "/") : "";
};

for (const [host, path] of [["hgcloud.to", "/e/se94hav1950j"], ["minochinos.com", "/embed/q7qfez3iwo9a"]]) {
  const u = "https://" + host + path;
  const r = await get(u, { referer: "https://cdn.tudorama.com/" });
  console.log(`\n#### ${host} ${r.s} ${r.b.length}b -> ${r.u.slice(0, 80)}`);
  const code = unpack(r.b);
  console.log("  unpack", code.length + "b | dir:", dir(code) || "-");
  if (r.b.length < 4000) console.log("  body:", r.b.replace(/\s+/g, " ").slice(0, 600));
  const origin = u.match(/^(https?:\/\/[^/]+)/)[1];
  const fc = path.split("/").filter(Boolean).pop();
  const bodies = [
    { filecode: fc, device: "android", codecs: { av1: "av01.0.09M.10", h265: "hvc1.1.6.L123.B0" } },
    { file_code: fc }, { filecode: fc }
  ];
  for (const body of bodies) {
    for (const ep of ["/api/stream", "/dl", "/api/source", "/embed/api"]) {
      try {
        const r2 = await fetch(origin + ep, {
          method: "POST", headers: { "user-agent": UA, "content-type": "application/json", origin, referer: u },
          body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
        });
        const t = await r2.text();
        if (r2.status !== 404 && r2.status !== 405) console.log(`  POST ${ep} ${JSON.stringify(body).slice(0, 22)} -> ${r2.status} ${t.replace(/\s+/g, " ").slice(0, 180)}`);
      } catch {}
    }
  }
  // jwplayer con sources en el propio HTML
  const inline = [...r.b.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((x) => /sources|file|m3u8|atob|eval/i.test(x));
  inline.slice(0, 2).forEach((x) => console.log("  [inline]", x.replace(/\s+/g, " ").slice(0, 400)));
}

console.log("\n#### pixeldrain");
const pd = await get("https://pixeldrain.com/api/file/MGrURDx9?download", { referer: "https://pixeldrain.com/u/MGrURDx9" });
console.log("  api", pd.s, pd.b.length + "b", pd.u);
const info = await get("https://pixeldrain.com/api/file/MGrURDx9/info");
console.log("  info", info.s, info.b.replace(/\s+/g, " ").slice(0, 300));

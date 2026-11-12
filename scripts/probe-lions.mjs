const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Mobile Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const hosts = [
  ["filelions.to", "ee78t5yjk3ys", "/v/"],
  ["streamwish.to", "ft1t2mkwlz2z", "/e/"],
  ["streamtape.com", "yAq62PaPAVS19jP", "/e/"]
];
for (const [host, code, kind] of hosts) {
  const embed = `https://${host}${kind}${code}`;
  let page = { s: 0, b: "" };
  try { const r = await fetch(embed, { headers: { ...H, Referer: "https://player.cuevana3.eu/" }, redirect: "follow" }); page = { s: r.status, b: await r.text() }; } catch (e) { page = { s: 0, b: String(e.cause && e.cause.code || e.message) }; }
  let api = "skip";
  try {
    const r = await fetch(`https://${host}/api/stream`, {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json", Origin: `https://${host}`, Referer: embed },
      body: JSON.stringify({ filecode: code, device: "android", codecs: { av1: "av01.0.09M.10", h265: "hvc1.1.6.L123.B0" } })
    });
    const t = await r.text();
    try { const j = JSON.parse(t); api = j.streaming_url ? "OK " + j.streaming_url.slice(0, 60) : "no url: " + t.slice(0, 60); }
    catch { api = r.status + " " + t.replace(/\s+/g, " ").slice(0, 50); }
  } catch (e) { api = "ERR " + String(e.cause && e.cause.code || e.message); }
  console.log(host.padEnd(18), "page=" + String(page.s).padEnd(4), "len=" + String(page.b.length).padEnd(7), "api:", api);
}

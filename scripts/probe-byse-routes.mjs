// byse: sondeo de rutas del API (el bundle no da los nombres literales).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const CODE = "f2rwhq07ydg3";
const BASE = "https://bysefujedu.com";
const paths = [
  "/api/video/", "/api/v1/video/", "/api/embed/", "/api/v1/embed/", "/api/stream/", "/api/v1/stream/",
  "/api/file/", "/api/v1/file/", "/api/resolve/", "/api/player/", "/api/v1/player/", "/api/source/",
  "/api/videos/", "/api/links/", "/api/info/", "/api/media/", "/api/v1/media/", "/api/get/", "/api/watch/"
];
const qs = [CODE, CODE + "/", "?code=" + CODE, "?filecode=" + CODE, "?id=" + CODE, "?file_code=" + CODE];
const tryOne = async (method, url, body) => {
  try {
    const r = await fetch(url, {
      method,
      headers: { "user-agent": UA, accept: "application/json, text/plain, */*", origin: BASE, referer: BASE + "/e/" + CODE, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual", signal: AbortSignal.timeout(12000)
    });
    const t = await r.text();
    if (r.status === 404 && /<html|Cannot GET|Not Found<\/title>/i.test(t)) return;
    console.log(`${method} ${url.replace(BASE, "")} -> ${r.status} ${t.replace(/\s+/g, " ").slice(0, 150)}`);
  } catch {}
};
for (const p of paths) {
  for (const q of qs) {
    const url = BASE + p + q;
    await tryOne("GET", url);
    await tryOne("POST", url, { filecode: CODE });
  }
}
console.log("\n### streamwish con UA de bot");
for (const ua of [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
]) {
  const r = await fetch("https://streamwish.com/e/x8k2m1p4q7w9", { headers: { "user-agent": ua, accept: "*/*" }, signal: AbortSignal.timeout(15000) });
  const t = await r.text();
  console.log(`${ua.slice(0, 24)} -> ${r.status} ${t.length}b ${t.replace(/\s+/g, " ").slice(0, 90)}`);
}

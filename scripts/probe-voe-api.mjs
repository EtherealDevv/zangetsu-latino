// voe: ¿hay API de metadata además del payload ofuscado?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const HOST = "https://susanexpectcare.com";
const CODE = "71bxcr4ajvhq";
const paths = [
  `/api/v1/video/${CODE}`, `/api/video/${CODE}`, `/api/v1/videos/${CODE}`, `/api/source/${CODE}`,
  `/api/v1/embed/${CODE}`, `/api/embed/${CODE}`, `/api/v1/file/${CODE}`, `/api/file/${CODE}`,
  `/api/v1/info/${CODE}`, `/api/info/${CODE}`, `/api/v1/stream/${CODE}`, `/api/stream/${CODE}`,
  `/api/v1/player/${CODE}`, `/api/player/${CODE}`, `/api/v1/status/${CODE}`, `/api/status/${CODE}`
];
for (const p of paths) {
  try {
    const r = await fetch(HOST + p, { headers: { "user-agent": UA, accept: "application/json", referer: `${HOST}/e/${CODE}` }, redirect: "manual", signal: AbortSignal.timeout(12000) });
    const t = await r.text();
    if (r.status === 404 && /Cannot GET|<html/i.test(t)) continue;
    console.log(`${r.status} ${p} ${r.headers.get("content-type") || ""} -> ${t.replace(/\s+/g, " ").slice(0, 160)}`);
  } catch (e) { console.log(`ERR ${p} ${String(e.cause?.code || e.message)}`); }
}

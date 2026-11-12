// byse: donde aparece key_parts (el objeto cifrado no es el meta pelado).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const CODE = process.argv[2] || "f2rwhq07ydg3";

const probe = async (label, path, hdrs) => {
  try {
    const r = await fetch(B + path, {
      headers: { "user-agent": UA, accept: "application/json, text/plain, */*", referer: `${B}/e/${CODE}`, origin: B, ...(hdrs || {}) },
      signal: AbortSignal.timeout(15000),
    });
    const t = await r.text();
    const hit = /key_parts/.test(t);
    console.log(`${r.status} ${hit ? "KEY_PARTS " : ""}${label} -> ${t.replace(/\s+/g, " ").slice(0, 130)}`);
    return hit ? t : null;
  } catch (e) { console.log(`ERR ${label} ${String(e.cause?.code || e.message).slice(0, 40)}`); return null; }
};

const variants = [
  [`/api/videos/${CODE}/?embed=1`],
  [`/api/videos/${CODE}/?embed=true`],
  [`/api/videos/${CODE}/?embed=1&viewer_id=1`],
  [`/api/videos/${CODE}/?player=1`],
  [`/api/videos/${CODE}/?download=1`],
  [`/api/videos/${CODE}/?fresh=1`],
  [`/api/videos/${CODE}/?nocache=1`],
  [`/api/videos/embed/${CODE}/`],
  [`/api/videos/${CODE}/embed`],
  [`/api/videos/${CODE}/playback`],
  [`/api/videos/${CODE}/access`],
  [`/api/videos/${CODE}/key`],
  [`/api/videos/${CODE}/keys`],
  [`/api/videos/${CODE}/source`],
  [`/api/videos/${CODE}/sources`],
];
for (const [p] of variants) await probe(p, p);
await probe("meta con X-Embed", `/api/videos/${CODE}/`, { "x-byse-embed": "1" });
await probe("meta con Sec-Fetch", `/api/videos/${CODE}/`, { "sec-fetch-mode": "navigate", "sec-fetch-dest": "iframe", "sec-fetch-site": "cross-site" });

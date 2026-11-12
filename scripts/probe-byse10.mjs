// byse: con cookie de sesion del embed, /stream acepta el token?
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const CODE = "f2rwhq07ydg3";

const jar = new Map();
const absorb = (r) => {
  const raw = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
  const all = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  return all;
};
let cookies = "";

const hit = async (label, path, extra) => {
  const r = await fetch(B + path, {
    headers: {
      "user-agent": UA,
      accept: "application/json, text/plain, */*",
      referer: `${B}/e/${CODE}`,
      origin: B,
      "accept-language": "es-419,es;q=0.9",
      ...(cookies ? { cookie: cookies } : {}),
      ...(extra || {}),
    },
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  cookies = absorb(r);
  const t = await r.text();
  console.log(`${r.status} ${label} -> ${t.replace(/\s+/g, " ").slice(0, 220)}`);
  return { status: r.status, body: t };
};

console.log("cookies iniciales:", cookies || "(ninguna)");
await hit("embed", `/e/${CODE}`, { accept: "text/html" });
console.log("cookies tras embed:", [...jar.keys()].join(" ") || "(ninguna)");

const meta = await hit("meta", `/api/videos/${CODE}/`);
const md = meta.body;
// cualquier campo que huela a token / url / firma
for (const k of ["token", "url", "stream", "hls", "source", "key", "sig", "expire"]) {
  const m = md.match(new RegExp(`"([a-z_]*${k}[a-z_]*)"\\s*:\\s*"?([^",}]{0,120})`, "i"));
  if (m) console.log(`  campo ${k}: ${m[1]} = ${m[2]}`);
}
console.log("\nmeta completa:", md.slice(0, 900));

await hit("stream", `/api/videos/stream/${CODE}`);
await hit("stream (Accept json)", `/api/videos/stream/${CODE}`, { accept: "application/json" });
await hit("stream con X-Requested-With", `/api/videos/stream/${CODE}`, { "x-requested-with": "XMLHttpRequest" });
await hit("stream con byse-app", `/api/videos/stream/${CODE}`, { "x-byse-client": "web", "x-byse-version": "1.0.0" });

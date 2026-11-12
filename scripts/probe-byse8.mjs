// byse: /api/videos/<code>/ y /api/videos/stream/<code>.
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const t = fs.readFileSync(".sfref/byse-videoPagesBundle-Bgi0QmPo.js", "utf8");
const zt = t.match(/Zt\s*=\s*\(\)\s*=>\s*\{?[^}]{0,300}/);
console.log("Zt:", zt ? zt[0].replace(/\s+/g, " ").slice(0, 300) : "-");
const zt2 = [...new Set([...t.matchAll(/(?:const|let|var)\s+Zt\s*=\s*([^;]{0,200})/g)].map((m) => m[1]))];
console.log("Zt defs:", zt2.join(" || ").slice(0, 400));
const hosts = [...new Set([...t.matchAll(/https?:\/\/[a-z0-9.-]*(?:api|byse|sx)[a-z0-9.-]*/gi)].map((m) => m[0]))];
console.log("hosts:", hosts.join("  "));

const CODE = "f2rwhq07ydg3";
for (const host of ["https://bysefujedu.com", "https://api.byse.sx"]) {
  for (const p of [`/api/videos/${CODE}/`, `/api/videos/stream/${CODE}`, `/api/videos/${CODE}/embed/`, `/api/videos/${CODE}/timeslider`]) {
    try {
      const r = await fetch(host + p, { headers: { "user-agent": UA, accept: "application/json", referer: `https://bysefujedu.com/e/${CODE}`, origin: "https://bysefujedu.com" }, signal: AbortSignal.timeout(15000) });
      const body = await r.text();
      console.log(`${r.status} ${host.replace("https://", "")}${p} -> ${body.replace(/\s+/g, " ").slice(0, 200)}`);
    } catch (e) { console.log(`ERR ${host}${p} ${String(e.cause?.code || e.message)}`); }
  }
}

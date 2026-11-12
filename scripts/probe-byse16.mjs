// byse: playback.key_parts -> clave AES-256-GCM -> JSON con la url del stream.
import crypto from "node:crypto";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const CODE = process.argv[2] || "f2rwhq07ydg3";

const r = await fetch(`${B}/api/videos/${CODE}/?embed=1`, {
  headers: { "user-agent": UA, accept: "application/json", referer: `${B}/e/${CODE}`, origin: B },
  signal: AbortSignal.timeout(15000),
});
const j = await r.json();
const p = j.playback || {};
console.log("status", r.status, "| playback keys:", Object.keys(p).join(" "));
console.log("algorithm:", p.algorithm, "| version:", p.version, "| key_parts:", JSON.stringify(p.key_parts));

const b64u = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const iv = b64u(p.iv);
const all = b64u(p.payload);
const tag = all.subarray(all.length - 16);
const ct = all.subarray(0, all.length - 16);

const order = (parts, version) => {
  const n = Number(version);
  if (!Number.isInteger(n) || n < 1 || n > 20) return parts;
  const picks = [n, 31 - n].filter((i) => i >= 1 && i <= parts.length);
  return picks.length ? picks.map((i) => parts[i - 1]) : parts;
};

const decode = (label, key) => {
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
    d.setAuthTag(tag);
    const out = Buffer.concat([d.update(ct), d.final()]).toString("utf8");
    console.log(`\n[${label}] OK ${key.length}b ->`, out.slice(0, 500));
    return out;
  } catch (e) {
    console.log(`[${label}] ${String(e.message).slice(0, 50)}`);
    return null;
  }
};

const parts = Array.isArray(p.key_parts) ? p.key_parts : [];
const bufs = parts.map(b64u);
console.log("partes:", bufs.map((b) => b.length + "b").join(" "));
const trials = [
  ["directo", bufs],
  ["reordenado", order(parts, p.version).map(b64u)],
  ["inverso", order(parts, p.version).slice().reverse().map(b64u)],
];
for (const [label, list] of trials) {
  const key = Buffer.concat(list);
  console.log(`\n-- ${label}: ${key.length}b`);
  if (key.length === 32) decode(label, key);
  else if (key.length > 32) decode(label + " cortado", key.subarray(0, 32));
  else decode(label + " sha256", crypto.createHash("sha256").update(key).digest());
}

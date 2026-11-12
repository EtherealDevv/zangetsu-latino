// byse: descifrar playback (AES-256-GCM) con key_parts del meta embed.
import crypto from "node:crypto";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const CODE = process.argv[2] || "f2rwhq07ydg3";

const r = await fetch(`${B}/api/videos/${CODE}/?embed=1`, {
  headers: { "user-agent": UA, accept: "application/json", referer: `${B}/e/${CODE}`, origin: B },
  signal: AbortSignal.timeout(15000),
});
const j = await r.json();
console.log("status", r.status, "| claves:", Object.keys(j).join(" "));
console.log("version:", j.version, "| cache:", j.cache_status);
console.log("playback:", JSON.stringify(j.playback).slice(0, 200));
console.log("key_parts:", JSON.stringify(j.key_parts));
if (!j.playback) process.exit(0);

const b64u = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const iv = b64u(j.playback.iv);
const body = b64u(j.playback.payload);
const tag = body.subarray(body.length - 16);
const ct = body.subarray(0, body.length - 16);

// ws(): reordena key_parts segun `version` (n -> [n, 31-n]) y luego las concatena
const order = (parts, version) => {
  const n = Number(version);
  if (!Number.isInteger(n) || n < 1 || n > 20) return parts;
  const picks = [n, 31 - n].filter((i) => i >= 1 && i <= parts.length);
  return picks.length ? picks.map((i) => parts[i - 1]) : parts;
};

const tryKey = (label, raw) => {
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", raw, iv);
    d.setAuthTag(tag);
    const out = Buffer.concat([d.update(ct), d.final()]).toString("utf8");
    console.log(`\n[${label}] OK (${raw.length}b key) ->`, out.slice(0, 400));
    return true;
  } catch (e) {
    console.log(`[${label}] ${String(e.message).slice(0, 60)}`);
    return false;
  }
};

const parts = j.key_parts;
console.log("\nkey largo total:", parts.reduce((a, p) => a + b64u(p).length, 0), "b");
const variants = [
  ["orden del server", parts.map(b64u)],
  ["reordenado por version", order(parts, j.version).map(b64u)],
  ["reordenado inverso", order(parts, j.version).reverse().map(b64u)],
];
for (const [label, bufs] of variants) {
  const key = Buffer.concat(bufs);
  console.log(`\n-- ${label}: ${key.length}b`);
  if (key.length === 32) tryKey(label, key);
  else if (key.length >= 32) tryKey(label + " (primeros 32)", key.subarray(0, 32));
  else {
    tryKey(label + " sha256", crypto.createHash("sha256").update(key).digest());
    tryKey(label + " sha256-hex", Buffer.from(crypto.createHash("sha256").update(key).digest("hex")).subarray(0, 32));
  }
}

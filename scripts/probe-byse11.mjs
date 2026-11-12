// byse: el meta trae playback cifrado (AES-256-GCM) + key_parts. Ver la forma exacta.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const CODE = process.argv[2] || "f2rwhq07ydg3";

const r = await fetch(`${B}/api/videos/${CODE}/`, {
  headers: { "user-agent": UA, accept: "application/json", referer: `${B}/e/${CODE}` },
  signal: AbortSignal.timeout(15000),
});
const j = await r.json();
console.log("status", r.status);
console.log("claves:", Object.keys(j).join("  "));
console.log("\nplayback:", JSON.stringify(j.playback, null, 1).slice(0, 400));
console.log("\nkey_parts:", JSON.stringify(j.key_parts));
if (j.key_parts) {
  j.key_parts.forEach((p, i) =>
    console.log(`  [${i}] ${typeof p} ${String(p).length}b${typeof p === "string" ? " " + p.slice(0, 40) : ""}`)
  );
}
for (const k of Object.keys(j)) {
  const v = j[k];
  if (typeof v === "string" && v.length > 40 && !/^https?:/.test(v)) console.log(`\n${k} (${v.length}b): ${v.slice(0, 80)}…`);
  if (Array.isArray(v) && v.length && v.length < 6) console.log(`\n${k}: ${JSON.stringify(v).slice(0, 300)}`);
}

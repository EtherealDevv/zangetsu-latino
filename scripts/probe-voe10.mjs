// voe: anatomia de la pagina — que script hace que y quien define el payload.
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

const html = fs.existsSync(".sfref/voe-page.html")
  ? fs.readFileSync(".sfref/voe-page.html", "utf8")
  : await (await fetch("https://susanexpectcare.com/e/71bxcr4ajvhq", { headers: { "user-agent": UA } })).text();

const tags = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
console.log("page", html.length + "b | scripts", tags.length);
tags.forEach((m, i) => {
  const attrs = m[1].replace(/\s+/g, " ").trim();
  const body = m[2];
  const kind = /application\/json/.test(attrs) ? "JSON" : (/\bsrc=/.test(attrs) ? "EXT" : "inline");
  console.log(
    `\n[${i}] ${kind} ${String(body.length).padStart(6)}b  ${attrs.slice(0, 110)}`
  );
  if (kind !== "EXT") console.log("     ", body.replace(/\s+/g, " ").trim().slice(0, 240));
});

// el payload: claves y pinta, sin volcarlo entero
const payloadTag = tags.find((m) => /application\/json/.test(m[1]));
if (payloadTag) {
  const raw = payloadTag[2].trim();
  console.log("\n=== payload", raw.length + "b");
  try {
    const j = JSON.parse(raw);
    console.log("keys:", Object.keys(j).join("  "));
    for (const [k, v] of Object.entries(j)) {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      console.log(`  ${k}: ${String(s).slice(0, 100)}${String(s).length > 100 ? ` …(${String(s).length}b)` : ""}`);
    }
  } catch (e) {
    console.log("no parsea:", String(e.message).slice(0, 80), "| head:", raw.slice(0, 200));
  }
}

// el bloque grande: primeras lineas reales, para ver el envoltorio
const big = tags.filter((m) => m[2].length > 50000).sort((a, b) => b[2].length - a[2].length)[0];
if (big) {
  console.log("\n=== state machine head");
  console.log(big[2].slice(0, 900));
  console.log("\n=== tail");
  console.log(big[2].slice(-500));
}

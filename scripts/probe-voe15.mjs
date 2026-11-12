// voe: la seccion del loader que consume el JSON (el algoritmo real).
import fs from "node:fs";
const t = fs.readFileSync(".sfref/voe-loader.js", "utf8");
const at = t.indexOf('querySelectorAll(\'script[type=\\x22application/json\\x22]\')');
const i = at >= 0 ? at : t.indexOf("application/json");
console.log("indice:", i, "| total:", t.length);
console.log("\n=== consumidor del payload");
console.log(t.slice(i - 1200, i + 5200));

console.log("\n=== literales de 56-72 chars (posible alfabeto)");
const lits = [...t.matchAll(/['"]([^'"\\]{56,72})['"]/g)].map((m) => m[1]);
const cand = [...new Set(lits)].filter((s) => /[A-Za-z]/.test(s) && /[!@#$%^&*_\-]/.test(s));
console.log(cand.slice(0, 6).join("\n") || "(ninguno)");

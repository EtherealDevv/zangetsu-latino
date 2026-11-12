// voe: rot13 -> quitar los 7 tokens basura -> atob -> -3 -> reverse -> atob -> JSON.
import fs from "node:fs";
const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const raw = JSON.parse((page.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1])[0];

const rot13 = (s) =>
  s.replace(/[a-zA-Z]/g, (c) => {
    const x = c.charCodeAt(0);
    return x >= 65 && x <= 90 ? String.fromCharCode(((x - 65 + 13) % 26) + 65) : String.fromCharCode(((x - 97 + 13) % 26) + 97);
  });
const atob = (s) => Buffer.from(s, "base64").toString("binary");

const JUNK = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
let s = rot13(raw);
for (const j of JUNK) s = s.split(j).join("_");
s = s.split("_").join("");
console.log("base64:", s.length + "b | limpio:", /^[A-Za-z0-9+/=]+$/.test(s));

const b1 = atob(s);
const shifted = [...b1].map((c) => String.fromCharCode(c.charCodeAt(0) - 3)).join("");
const out = atob(shifted.split("").reverse().join(""));
console.log("\ndecodificado", out.length + "b");
console.log(out.slice(0, 600));
try {
  const j = JSON.parse(out);
  console.log("\nJSON ok | claves:", Object.keys(j).join(" "));
  for (const k of Object.keys(j)) {
    const v = j[k];
    if (typeof v === "string" && v.length < 200) console.log(`  ${k}: ${v}`);
  }
} catch (e) {
  console.log("\nno parsea:", e.message.slice(0, 80));
}

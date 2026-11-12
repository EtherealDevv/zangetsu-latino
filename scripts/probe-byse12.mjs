// byse: quien descifra playback y de donde saca la clave AES.
import fs from "node:fs";
const t = fs.readFileSync(".sfref/byse-videoPagesBundle-Bgi0QmPo.js", "utf8");
console.log("bundle", t.length + "b");

const show = (label, re, max = 3, pad = 340) => {
  let m, n = 0;
  console.log(`\n===== ${label}`);
  while ((m = re.exec(t)) !== null && n < max) {
    console.log("  ...", t.slice(Math.max(0, m.index - pad), m.index + pad).replace(/\s+/g, " "), "\n");
    n++;
  }
  if (!n) console.log("  (nada)");
};

show("playback", /playback/gi, 4);
show("AES-GCM / algorithm", /AES-GCM|algorithm/gi, 3);
show("subtle.importKey / decrypt", /importKey|subtle|decrypt/gi, 4);
show("iv", /\biv\b/g, 3);
show("base64 / atob", /atob|fromBase64|b64/gi, 3);

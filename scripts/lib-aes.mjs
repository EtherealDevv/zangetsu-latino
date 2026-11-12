// AES-256-CTR en JS puro (para QuickJS) — validado contra el payload de byse.
import crypto from "node:crypto";

// --- sbox generada de GF(2^8), sin tabla literal ---
const SBOX = (() => {
  const s = new Uint8Array(256), inv = new Uint8Array(256);
  let p = 1, q = 1;
  do {
    p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0);
    q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff;
    if (q & 0x80) q ^= 0x09;
    inv[p] = q;
  } while (p !== 1);
  inv[0] = 0;
  for (let i = 0; i < 256; i++) {
    let x = inv[i], r = x;
    for (let k = 0; k < 4; k++) { r = ((r << 1) | (r >>> 7)) & 0xff; x ^= r; }
    s[i] = x ^ 0x63;
  }
  return s;
})();
const xtime = (b) => ((b << 1) ^ (b & 0x80 ? 0x1b : 0)) & 0xff;
const mul = (a, b) => { let r = 0; while (b) { if (b & 1) r ^= a; a = xtime(a); b >>= 1; } return r; };

function expandKey(key) {
  const nk = key.length / 4, nr = nk + 6;
  const w = new Uint8Array(16 * (nr + 1));
  w.set(key);
  let rcon = 1;
  for (let i = nk; i < 4 * (nr + 1); i++) {
    let t = [w[(i - 1) * 4], w[(i - 1) * 4 + 1], w[(i - 1) * 4 + 2], w[(i - 1) * 4 + 3]];
    if (i % nk === 0) {
      t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]];
      rcon = xtime(rcon);
    } else if (nk > 6 && i % nk === 4) {
      t = [SBOX[t[0]], SBOX[t[1]], SBOX[t[2]], SBOX[t[3]]];
    }
    for (let j = 0; j < 4; j++) w[i * 4 + j] = w[(i - nk) * 4 + j] ^ t[j];
  }
  return { w, nr };
}

function encryptBlock(rk, input) {
  const { w, nr } = rk;
  const s = new Uint8Array(input);
  const add = (round) => { for (let i = 0; i < 16; i++) s[i] ^= w[round * 16 + i]; };
  add(0);
  for (let round = 1; round <= nr; round++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    // ShiftRows (column-major state)
    const t = s.slice();
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[r + 4 * c] = t[r + 4 * ((c + r) % 4)];
    if (round !== nr) {
      for (let c = 0; c < 4; c++) {
        const a0 = s[4 * c], a1 = s[4 * c + 1], a2 = s[4 * c + 2], a3 = s[4 * c + 3];
        s[4 * c] = mul(a0, 2) ^ mul(a1, 3) ^ a2 ^ a3;
        s[4 * c + 1] = a0 ^ mul(a1, 2) ^ mul(a2, 3) ^ a3;
        s[4 * c + 2] = a0 ^ a1 ^ mul(a2, 2) ^ mul(a3, 3);
        s[4 * c + 3] = mul(a0, 3) ^ a1 ^ a2 ^ mul(a3, 2);
      }
    }
    add(round);
  }
  return s;
}

// CTR estilo GCM: contador de 32 bits en los ultimos 4 bytes, arranca en 2.
function ctr(key, iv, data) {
  const rk = expandKey(key);
  const ctrBlock = new Uint8Array(16);
  ctrBlock.set(iv.subarray(0, 12));
  const out = new Uint8Array(data.length);
  let c = 2;
  for (let off = 0; off < data.length; off += 16) {
    ctrBlock[12] = (c >>> 24) & 0xff; ctrBlock[13] = (c >>> 16) & 0xff;
    ctrBlock[14] = (c >>> 8) & 0xff; ctrBlock[15] = c & 0xff;
    const ks = encryptBlock(rk, ctrBlock);
    const n = Math.min(16, data.length - off);
    for (let i = 0; i < n; i++) out[off + i] = data[off + i] ^ ks[i];
    c = (c + 1) >>> 0;
  }
  return out;
}

// --- prueba contra byse real ---
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const CODE = process.argv[2] || "f2rwhq07ydg3";
const b64u = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

const j = await (await fetch(`${B}/api/videos/${CODE}/?embed=1`, { headers: { "user-agent": UA, accept: "application/json", referer: `${B}/e/${CODE}`, origin: B } })).json();
const p = j.playback;
const order = (parts, version) => {
  const n = Number(version);
  if (!Number.isInteger(n) || n < 1 || n > 20) return parts;
  const picks = [n, 31 - n].filter((i) => i >= 1 && i <= parts.length);
  return picks.length ? picks.map((i) => parts[i - 1]) : parts;
};
const key = Buffer.concat(order(p.key_parts, p.version).map(b64u));
const iv = b64u(p.iv);
const all = b64u(p.payload);
const ct = all.subarray(0, all.length - 16);

const mine = Buffer.from(ctr(new Uint8Array(key), new Uint8Array(iv), new Uint8Array(ct))).toString("utf8");
const ref = (() => {
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(all.subarray(all.length - 16));
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
})();
console.log("AES-256-CTR propio:", mine === ref ? "IDENTICO a node:crypto" : "DIFERENTE");
console.log("plaintext:", mine.slice(0, 300));

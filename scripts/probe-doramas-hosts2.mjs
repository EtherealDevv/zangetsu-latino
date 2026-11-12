// Resolvers reales sobre los hosts que usa Doramasflix, en un solo pase.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
function unpack(s) {
  s = String(s);
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, payload = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { payload += s[i + 1]; i += 2; continue; } if (c === "'") break; payload += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  const base = parseInt(m[1], 10), count = parseInt(m[2], 10);
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const d = rest[j]; if (d === "\\") { dict += rest[j + 1]; j += 2; continue; } if (d === "'") break; dict += d; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let out = payload;
  for (let k = count - 1; k >= 0; k--) if (words[k]) out = out.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return out;
}
const findStream = (b) => {
  const m = b.match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || b.match(/https?:[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || b.match(/https?:[^"'\s\\]+\.mp4[^"'\s\\]*/i);
  return m ? String(m[1] || m[0]).replace(/\\\//g, "/") : "";
};

const API = "https://sv1.fluxcedene.net/api/gql";
const H = {
  "accept": "application/json, text/plain, */*", "content-type": "application/json",
  "origin": "https://doramasflix.in", "referer": "https://doramasflix.in/",
  "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==", "user-agent": UA
};
const gql = async (o, v, q) => JSON.parse(await (await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) })).text());

// juntar links de varias series para tener variedad de hosts
const list = await gql("listDoramas", { page: 1, sort: "POPULARITY_DESC", perPage: 30, filter: {} },
  `query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { _id name } } }`);
const pool = [];
for (const d of list.data.paginationDorama.items.slice(0, 10)) {
  const eps = await gql("listEpisodes", { serie_id: d._id, season_number: 1 },
    `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id } }`);
  const ep = (eps.data?.listEpisodes || [])[0];
  if (!ep) continue;
  const lk = await gql("getEpisodeLinks", { id: ep._id }, `query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { links_online } }`);
  for (const l of lk.data?.getEpisodeLinks?.links_online || []) pool.push({ ...l, serie: d.name });
}
const stat = {};
for (const l of pool) { const h = new URL(l.embed || l.link).host; const k = h + "|" + l.language_code; stat[k] = (stat[k] || 0) + 1; }
console.log("links:", pool.length, "\n" + Object.entries(stat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join("  "));

const pick = {};
for (const l of pool) { const h = new URL(l.embed || l.link).host; if (!pick[h]) pick[h] = l; }
const latPick = {};
for (const l of pool) { const h = new URL(l.embed || l.link).host; if (l.language_code === "es" && !latPick[h]) latPick[h] = l; }

console.log("\n== resolvers ==");
for (const host of Object.keys(pick)) {
  const l = latPick[host] || pick[host];
  const u = (l.embed || l.link).replace(/\\\//g, "/");
  const tag = `[${host}] ${l.language_code}`;
  try {
    if (/primeload/.test(host)) {
      const id = (u.match(/\/embed\/([A-Za-z0-9_-]+)/) || [])[1];
      const api = await get(`https://primeload.co/api/v1/player/${id}`, { referer: "https://primeload.co/" });
      const j = JSON.parse(api.b || "{}");
      const master = j.master_manifest || "";
      const ok = master ? await get(master, { referer: "https://primeload.co/" }) : { s: 0, b: "" };
      console.log(`${tag} player=${api.s} master=${master ? "si" : "no"} m3u8=${ok.s} ${(ok.b || "").slice(0, 30)}`);
      if (master && ok.s !== 200) {
        // ¿token por query?
        for (const q of ["?token=1", "?session=1"]) {
          const t = await get(master + q, { referer: "https://primeload.co/" });
          console.log(`    ${q} -> ${t.s} ${(t.b || "").slice(0, 30)}`);
        }
      }
    } else if (/voe\.sx/.test(host)) {
      const r = await get(u, { referer: "https://doramasflix.in/" });
      console.log(`${tag} page=${r.s} ${r.b.length}b dirs=${findStream(r.b) || "-"} | ${(r.b || "").replace(/\s+/g, " ").slice(0, 160)}`);
    } else if (/mxdrop|filemoon|byse|vidhide/.test(host)) {
      const r = await get(u, { referer: "https://doramasflix.in/" });
      const code = unpack(r.b);
      console.log(`${tag} page=${r.s} ${r.b.length}b unpack=${code.length}b dirs=${findStream(code) || "-"}`);
    } else if (/ok\.ru/.test(host)) {
      const r = await get(u, { referer: "https://doramasflix.in/" });
      const meta = (r.b.match(/data-options="([^"]+)"/) || [])[1] || "";
      console.log(`${tag} page=${r.s} ${r.b.length}b metadata=${meta ? "si" : "no"}`);
    } else {
      const r = await get(u, { referer: "https://doramasflix.in/" });
      const code = unpack(r.b);
      console.log(`${tag} page=${r.s} ${r.b.length}b unpack=${code.length}b dirs=${findStream(code) || "-"} | ${(r.b || "").replace(/\s+/g, " ").slice(0, 120)}`);
    }
  } catch (e) { console.log(`${tag} ERR ${String(e.message).slice(0, 60)}`); }
}

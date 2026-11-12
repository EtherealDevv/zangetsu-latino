// Tudorama — fuente Zangetsu (doramas, series asiáticas y películas en
// español latino y subtitulado).
// WordPress con plantilla propia: el catálogo son tarjetas <article class=
// "ipst">, cada serie lista sus episodios como /ver/<slug>-sNxM/ y los
// servidores salen de un AJAX (corvus_get_servers) con el nonce y el post_id
// de esa misma página. Los servidores son envoltorios en cdn.tudorama.com que
// montan un iframe al host real; ahí se resuelve el m3u8/mp4.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://tudorama.com';
var VERSION = '1.1.0';

function getInfo() {
  return {
    name: 'Tudorama', lang: 'es', baseUrl: SITE,
    logo: SITE + '/favicon.ico', type: 'movie', version: VERSION
  };
}

// ── red ──────────────────────────────────────────────────────────────────────
function _get(url, ref) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9', 'Accept': 'text/html,application/xhtml+xml,*/*' };
  if (ref) h['Referer'] = ref;
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _post(url, body, ref) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': SITE, 'Referer': ref || SITE + '/',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: body
  }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _stream(url, quality, ref, kind) {
  var u = String(url).replace(/\\\//g, '/');
  return {
    url: u, quality: quality || 'HD',
    container: /\.m3u8(\?|$)|\/hls\d?\//i.test(u) ? 'hls' : 'mp4',
    headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' },
    kind: kind || 'dub', audioLang: kind === 'sub' ? null : 'es', subtitles: []
  };
}

function _abs(url, base) {
  var u = String(url || '').replace(/\\\//g, '/');
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  var host = (String(base).match(/^(https?:\/\/[^/]+)/) || [])[1] || SITE;
  return host + (u.charAt(0) === '/' ? '' : '/') + u;
}

function _ent(s) {
  return htmlText(String(s || '')).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}

// packer (jjencode): mismo desempaquetador que usa CineCalidad.
function _unpack(s) {
  s = String(s);
  var h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  var i = h + 3, payload = '';
  while (i < s.length) {
    var c = s[i];
    if (c === '\\') { payload += s[i + 1]; i += 2; continue; }
    if (c === "'") break;
    payload += c; i++;
  }
  var rest = s.slice(i + 1);
  var m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  var base = parseInt(m[1], 10), count = parseInt(m[2], 10);
  var j = rest.indexOf("'", m[0].length) + 1, dict = '';
  while (j < rest.length) {
    var d = rest[j];
    if (d === '\\') { dict += rest[j + 1]; j += 2; continue; }
    if (d === "'") break;
    dict += d; j++;
  }
  var words = dict.split('|');
  function enc(n) {
    return (n < base ? '' : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  }
  var out = payload;
  for (var k = count - 1; k >= 0; k--) {
    if (words[k]) out = out.replace(new RegExp('\\b' + enc(k) + '\\b', 'g'), words[k]);
  }
  return out;
}

// ── listados ─────────────────────────────────────────────────────────────────
// Cada tarjeta: <article class="ipst"> con enlace, portada y título.
function _cards(html) {
  var out = [], seen = {}, chunks = String(html || '').split(/<article class="ipst/);
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i].split(/<\/article>/)[0];
    var href = (c.match(/href="(https?:\/\/tudorama\.com\/(?:serie|pelicula)\/[^"]+)"/i) || [])[1] || '';
    if (!href || seen[href]) continue;
    var title = _ent((c.match(/class="ipst__title"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) || [])[1] || '');
    if (!title) title = _ent((c.match(/alt="([^"]*)"/i) || [])[1] || '');
    if (!title) continue;
    var cover = (c.match(/<img[^>]+src="([^"]+)"/i) || [])[1] || null;
    var isMovie = /\/pelicula\//i.test(href);
    seen[href] = 1;
    out.push({
      id: href, url: href, title: title, cover: cover,
      type: isMovie ? 'movie' : 'tv', sourceId: __SOURCE_ID
    });
  }
  return out;
}

function _list(path, type) {
  return _get(SITE + path, SITE + '/').then(function (html) { return _cards(html); });
}

function getHome() {
  return Promise.all([
    _list('/genero/emision/').then(function (i) { return { title: 'En emisión', items: i }; }),
    _list('/genero/series/').then(function (i) { return { title: 'K-Dramas', items: i }; }),
    _list('/genero/peliculas/').then(function (i) { return { title: 'Películas asiáticas', items: i }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _list('/genero/series/' + (page > 1 ? 'page/' + page + '/' : ''), 'tv').catch(function () { return []; });
}

function latest(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _list('/genero/emision/' + (page > 1 ? 'page/' + page + '/' : ''), 'tv').catch(function () { return []; });
}

// ── emparejado de títulos ────────────────────────────────────────────────────
var _zFold = {
  'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ñ': 'n', 'ç': 'c'
};

function _zNorm(s) {
  var t = String(s || '').toLowerCase(), out = '';
  for (var i = 0; i < t.length; i++) {
    var c = t.charAt(i);
    if (_zFold[c]) out += _zFold[c];
    else if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) out += c;
    else out += ' ';
  }
  return out.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}

// Z Mode se queda con el primer resultado que acepta el título: los que
// coinciden con la consulta se ponen delante y se marcan con englishTitle.
function _zAlias(items, query) {
  var q = _zNorm(query);
  if (!q || !items || !items.length) return items;
  var qt = q.split(' ').filter(function (t) { return t.length >= 4; });
  if (!qt.length) return items;
  var scored = [];
  for (var i = 0; i < items.length; i++) {
    if (!items[i] || !items[i].title) continue;
    var tt = _zNorm(items[i].title).split(' ');
    var score = 0, covered = 0;
    for (var a = 0; a < qt.length; a++) {
      var best = 0;
      for (var b = 0; b < tt.length; b++) {
        var w = tt[b];
        if (w.length < 4) continue;
        if (w === qt[a]) { best = 2; break; }
        if (best < 1 && (w.indexOf(qt[a]) === 0 || qt[a].indexOf(w) === 0)) best = 1;
      }
      if (best) covered++;
      score += best;
    }
    var need = qt.length <= 3 ? qt.length : Math.ceil(qt.length * 0.75);
    if (covered < need) continue;
    items[i].englishTitle = query;
    scored.push({ it: items[i], score: score, words: tt.length, at: i });
  }
  if (!scored.length) return items;
  scored.sort(function (x, y) {
    if (y.score !== x.score) return y.score - x.score;
    if (x.words !== y.words) return x.words - y.words;
    return x.at - y.at;
  });
  var out = [];
  for (var s = 0; s < scored.length; s++) out.push(scored[s].it);
  for (var k = 0; k < items.length; k++) if (!items[k].englishTitle) out.push(items[k]);
  return out;
}

function search(query, page) {
  var q = String(query || '').replace(/^\s+|\s+$/g, '');
  if (!q) return Promise.resolve([]);
  return _get(SITE + '/?s=' + encodeURIComponent(q), SITE + '/').then(function (html) {
    return _zAlias(_cards(html), q);
  }).catch(function () { return []; });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _meta(html, prop) {
  var m = html.match(new RegExp('property="' + prop + '"[^>]*content="([^"]*)"', 'i'))
    || html.match(new RegExp('content="([^"]*)"[^>]*property="' + prop + '"', 'i'));
  return m ? _ent(m[1]) : '';
}

var _NAV = { 'emision': 1, 'series': 1, 'cdrama': 1, 'jdrama': 1, 'reality-show': 1, 'espanol-latino': 1, 'sub-espanol': 1, 'proximamente': 1, 'peliculas': 1 };

function _genres(html) {
  var out = [], seen = {}, m, re = /href="https?:\/\/tudorama\.com\/genero\/([a-z0-9-]+)\/"/gi;
  while ((m = re.exec(html)) !== null) {
    var g = m[1];
    if (_NAV[g] || seen[g]) continue;
    seen[g] = 1;
    out.push(g.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }));
  }
  return out;
}

// Los episodios de la ficha vienen como /ver/<slug>-sNxM/.
function _episodes(html, slug, title) {
  var out = [], seen = {}, m;
  var re = new RegExp('href="(https?://tudorama\\.com/ver/' + slug + '-s(\\d+)x(\\d+)/)"', 'gi');
  while ((m = re.exec(html)) !== null) {
    var url = m[1];
    if (seen[url]) continue;
    seen[url] = 1;
    var se = parseInt(m[2], 10), ep = parseInt(m[3], 10);
    out.push({
      id: url, url: url,
      title: 'T' + se + ' · Cap ' + ep,
      number: ep, season: se, sourceId: __SOURCE_ID
    });
  }
  out.sort(function (a, b) { return a.season !== b.season ? a.season - b.season : a.number - b.number; });
  return out;
}

function _detail(url) {
  var self = String(url || '').replace(/\/+$/, '') + '/';
  return _get(self, SITE + '/').then(function (html) {
    if (!html) throw new Error('Tudorama: sin respuesta');
    var isMovie = /\/pelicula\//i.test(self);
    var slug = self.split('/').filter(function (x) { return x; }).pop();
    var title = _ent((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '') || _meta(html, 'og:title');
    var cover = _meta(html, 'og:image') || null;
    var desc = _meta(html, 'og:description');
    var genres = _genres(html);

    if (isMovie) {
      return {
        id: self, title: title, url: self, cover: cover,
        description: desc, genres: genres, studios: [],
        status: 'completed', year: null,
        type: 'movie', sourceId: __SOURCE_ID,
        episodes: [{ id: self, url: self, title: 'Ver película', number: 1, sourceId: __SOURCE_ID }],
        subCount: 0, dubCount: 1
      };
    }

    var eps = _episodes(html, slug, title);
    return {
      id: self, title: title, url: self, cover: cover,
      description: desc, genres: genres, studios: [],
      status: 'completed', year: null,
      type: 'tv', sourceId: __SOURCE_ID,
      episodes: eps, subCount: 0, dubCount: eps.length
    };
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── servidores ───────────────────────────────────────────────────────────────
// El AJAX pide el nonce y el post_id de la misma página que se está viendo:
// en /ver/ es el episodio, en /pelicula/ es la película.
function _servers(html, ref) {
  var nonce = (html.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1] || '';
  var id = (html.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1] || '';
  if (!nonce || !id) return Promise.resolve([]);
  var body = 'action=corvus_get_servers&nonce=' + encodeURIComponent(nonce) + '&post_id=' + encodeURIComponent(id);
  return _post(SITE + '/wp-admin/admin-ajax.php', body, ref).then(function (raw) {
    var list = null;
    try { list = JSON.parse(raw || 'null'); } catch (e) { return []; }
    return (list && list.length) ? list : [];
  });
}

// El envoltorio sólo monta un iframe al host real dentro del JS.
function _frame(wrapper, ref) {
  return _get(wrapper, ref).then(function (html) {
    return (html.match(/iframe\.src\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
  });
}

function _pixeldrain(frame, kind) {
  var id = String(frame).replace(/[?#].*$/, '').split('/').filter(function (x) { return x; }).pop();
  if (!id) return Promise.resolve([]);
  return Promise.resolve([_stream('https://pixeldrain.com/api/file/' + id + '?download', 'HD', 'https://pixeldrain.com/u/' + id, kind)]);
}

// ── voe / byse: los dos muros que quedaban ───────────────────────────────────
// voe: la página trae un <script type="application/json"> con una sola cadena.
// El decoder del sitio hace rot13, cambia siete tokens (@$ ^^ ~@ %? *~ !! #&)
// por '_', borra los '_', atob, resta 3 a cada byte, invierte y atob otra vez.
function _voeDecode(payload) {
  var s = String(payload), i, out = '', c;
  var junk = ['@$', '^^', '~@', '%?', '*~', '!!', '#&'];
  for (i = 0; i < s.length; i++) {
    c = s.charCodeAt(i);
    if (c >= 65 && c <= 90) c = ((c - 65 + 13) % 26) + 65;
    else if (c >= 97 && c <= 122) c = ((c - 97 + 13) % 26) + 97;
    out += String.fromCharCode(c);
  }
  for (i = 0; i < junk.length; i++) out = out.split(junk[i]).join('_');
  out = out.split('_').join('');
  var b = base64ToBytes(out), bin = '';
  for (i = 0; i < b.length; i++) bin += String.fromCharCode((b[i] - 3) & 255);
  bin = bin.split('').reverse().join('');
  var t = base64ToBytes(bin), txt = '';
  for (i = 0; i < t.length; i++) txt += String.fromCharCode(t[i]);
  return txt;
}

function _host(u) {
  var m = String(u).match(/^(https?:\/\/[^\/]+)/i);
  return m ? m[1] : '';
}

function _voe(embed, kind) {
  var host = _host(embed);
  return _get(embed, SITE + '/').then(function (html) {
    var m = String(html || '').match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) return [];
    var arr = null;
    try { arr = JSON.parse(m[1]); } catch (e) { return []; }
    var raw = (arr && arr.length) ? arr[0] : (arr && arr.payload);
    if (typeof raw !== 'string') return [];
    var conf = null;
    try { conf = JSON.parse(_voeDecode(raw)); } catch (e) { return []; }
    if (!conf) return [];
    var list = [], fb = conf.fallback, i, u, out = [], seen = {};
    if (conf.source) list.push(conf.source);
    if (typeof fb === 'string') fb = [fb];
    if (fb && fb.length) for (i = 0; i < fb.length && i < 4; i++) list.push(fb[i]);
    if (!list.length && conf.direct_access_url) list.push(conf.direct_access_url);
    for (i = 0; i < list.length; i++) {
      u = /^https?:/i.test(list[i]) ? list[i] : _abs(list[i], embed);
      if (!u || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, i ? 'auto' : 'HD', host + '/', kind));
    }
    return out;
  });
}

// byse: el meta trae playback cifrado con AES-256-GCM. La clave son dos
// key_parts (base64url) cuyo orden fija `version` (n y 31-n). GCM arranca el
// keystream de CTR en el contador 2, así que descifrar es AES-256-CTR y la
// etiqueta de 16 bytes del final se descarta.
var _SBOX = (function () {
  var sbox = [], inv = [], p = 1, q = 1, i, x, r, k;
  for (i = 0; i < 256; i++) inv[i] = 0;
  do {
    p = (p ^ ((p << 1) & 255) ^ (p & 128 ? 27 : 0)) & 255;
    q = (q ^ (q << 1)) & 255; q = (q ^ (q << 2)) & 255; q = (q ^ (q << 4)) & 255;
    if (q & 128) q ^= 9;
    inv[p] = q;
  } while (p !== 1);
  for (i = 0; i < 256; i++) {
    x = inv[i]; r = x;
    for (k = 0; k < 4; k++) { r = ((r << 1) | (r >>> 7)) & 255; x ^= r; }
    sbox[i] = x ^ 99;
  }
  return sbox;
})();

function _xtime(b) { return ((b << 1) ^ (b & 128 ? 27 : 0)) & 255; }
function _mul(a, b) { var r = 0; while (b) { if (b & 1) r ^= a; a = _xtime(a); b >>= 1; } return r; }

function _aesExpand(key) {
  var nk = 8, nr = 14, w = [], i, j, t, rcon = 1;
  for (i = 0; i < key.length; i++) w[i] = key[i];
  for (i = nk; i < 4 * (nr + 1); i++) {
    t = [w[(i - 1) * 4], w[(i - 1) * 4 + 1], w[(i - 1) * 4 + 2], w[(i - 1) * 4 + 3]];
    if (i % nk === 0) {
      t = [_SBOX[t[1]] ^ rcon, _SBOX[t[2]], _SBOX[t[3]], _SBOX[t[0]]];
      rcon = _xtime(rcon);
    } else if (i % nk === 4) {
      t = [_SBOX[t[0]], _SBOX[t[1]], _SBOX[t[2]], _SBOX[t[3]]];
    }
    for (j = 0; j < 4; j++) w[i * 4 + j] = w[(i - nk) * 4 + j] ^ t[j];
  }
  return w;
}

function _aesBlock(w, input) {
  var nr = 14, s = [], t = [], round, i, c, r, a0, a1, a2, a3;
  for (i = 0; i < 16; i++) s[i] = input[i] ^ w[i];
  for (round = 1; round <= nr; round++) {
    for (i = 0; i < 16; i++) s[i] = _SBOX[s[i]];
    for (i = 0; i < 16; i++) t[i] = s[i];
    for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) s[r + 4 * c] = t[r + 4 * ((c + r) % 4)];
    if (round !== nr) {
      for (c = 0; c < 4; c++) {
        a0 = s[4 * c]; a1 = s[4 * c + 1]; a2 = s[4 * c + 2]; a3 = s[4 * c + 3];
        s[4 * c] = _mul(a0, 2) ^ _mul(a1, 3) ^ a2 ^ a3;
        s[4 * c + 1] = a0 ^ _mul(a1, 2) ^ _mul(a2, 3) ^ a3;
        s[4 * c + 2] = a0 ^ a1 ^ _mul(a2, 2) ^ _mul(a3, 3);
        s[4 * c + 3] = _mul(a0, 3) ^ a1 ^ a2 ^ _mul(a3, 2);
      }
    }
    for (i = 0; i < 16; i++) s[i] ^= w[round * 16 + i];
  }
  return s;
}

function _aesCtr(key, iv, data) {
  var w = _aesExpand(key), ctr = [], out = [], off, i, n, ks, c = 2;
  for (i = 0; i < 16; i++) ctr[i] = i < 12 ? iv[i] : 0;
  for (off = 0; off < data.length; off += 16) {
    ctr[12] = (c >>> 24) & 255; ctr[13] = (c >>> 16) & 255; ctr[14] = (c >>> 8) & 255; ctr[15] = c & 255;
    ks = _aesBlock(w, ctr);
    n = Math.min(16, data.length - off);
    for (i = 0; i < n; i++) out[off + i] = data[off + i] ^ ks[i];
    c = (c + 1) >>> 0;
  }
  return out;
}

function _b64u(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return base64ToBytes(s);
}

function _bytesText(b) {
  var s = '', i;
  for (i = 0; i < b.length; i++) s += String.fromCharCode(b[i] & 255);
  return s;
}

function _byse(embed, kind) {
  var host = _host(embed);
  var code = String(embed).replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop();
  if (!host || !code) return Promise.resolve([]);
  return _get(host + '/api/videos/' + encodeURIComponent(code) + '/?embed=1', embed).then(function (txt) {
    var j = null;
    try { j = JSON.parse(txt); } catch (e) { return []; }
    var p = j && j.playback;
    if (!p || !p.payload || !p.iv || !p.key_parts || !p.key_parts.length) return [];
    var parts = p.key_parts, ver = Number(p.version), use = [], i, k, b, key = [];
    if (ver >= 1 && ver <= 20) {
      var picks = [ver, 31 - ver];
      for (i = 0; i < picks.length; i++) if (picks[i] >= 1 && picks[i] <= parts.length) use.push(parts[picks[i] - 1]);
    }
    if (!use.length) use = parts;
    for (i = 0; i < use.length; i++) {
      b = _b64u(use[i]);
      for (k = 0; k < b.length; k++) key.push(b[k]);
    }
    if (key.length < 32) return [];
    key = key.slice(0, 32);
    var iv = _b64u(p.iv), all = _b64u(p.payload);
    if (iv.length < 12 || all.length < 20) return [];
    var conf = null;
    try { conf = JSON.parse(_bytesText(_aesCtr(key, iv, all.slice(0, all.length - 16)))); } catch (e) { return []; }
    var srcs = (conf && conf.sources) || [], out = [], seen = {};
    for (i = 0; i < srcs.length; i++) {
      var u = srcs[i] && srcs[i].url;
      if (!u || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, srcs[i].label || 'HD', host + '/', kind));
    }
    return out;
  });
}

// earnvids / minochinos y demás clones de streamwish: el reproductor llega
// empaquetado y la lista queda en `var links={hls4:…,hls3:…,hls2:…}`. El
// player usa `hls4||hls3||hls2`, así que se respeta ese orden; las rutas
// relativas (/stream/<firma>/…) se resuelven contra el propio embed.
function _swish(frame, html, kind) {
  var code = _unpack(html);
  var out = [], seen = {};
  var obj = (code.match(/links\s*=\s*\{([\s\S]*?)\}\s*;/) || [])[1] || '';
  var order = ['hls4', 'hls3', 'hls2', 'hls', 'file'];
  for (var o = 0; o < order.length; o++) {
    var m = obj.match(new RegExp('["\']?' + order[o] + '["\']?\\s*:\\s*["\']([^"\']+)["\']'));
    if (!m) continue;
    var u = _abs(m[1], frame);
    if (!u || seen[u]) continue;
    seen[u] = 1;
    out.push(_stream(u, o <= 1 ? 'HD' : 'auto', frame, kind));
  }
  if (!out.length) {
    var re = /["']?(?:file|src)["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/gi, f;
    while ((f = re.exec(code)) !== null) {
      var v = _abs(f[1], frame);
      if (!v || seen[v]) continue;
      seen[v] = 1;
      out.push(_stream(v, 'HD', frame, kind));
    }
  }
  if (!out.length) {
    var d = (code.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/i) || [])[0]
      || (html.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/i) || [])[0];
    if (d) out.push(_stream(d, 'HD', frame, kind));
  }
  return out;
}

function _resolve(frame, kind) {
  var f = String(frame || '').replace(/\\\//g, '/');
  if (!f) return Promise.resolve([]);
  if (/voe\.|susanexpectcare/i.test(f)) return _voe(f, kind);
  if (/byse/i.test(f)) return _byse(f, kind);
  if (/pixeldrain\./i.test(f)) return _pixeldrain(f, kind);
  return _get(f, SITE + '/').then(function (html) {
    if (!html) return [];
    if (/minochinos|earnvids|streamwish|hgcloud|flaswish|wishfast|jodwish|uqload|vidhide|filelions/i.test(f)) return _swish(f, html, kind);
    return _swish(f, html, kind);
  });
}

var LANG = { 'es': 0, 'lat': 0, 'en': 1, 'ko': 2, 'ja': 3, 'zh': 4, 'th': 5 };

function getVideoSources(url) {
  var ref = String(url || '').replace(/\/+$/, '') + '/';
  return _get(ref, SITE + '/').then(function (html) {
    if (!html) throw new Error('Tudorama: sin respuesta');
    return _servers(html, ref);
  }).then(function (list) {
    if (!list.length) throw new Error('Tudorama: sin servidores');
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (!it || !it.url || seen[it.url]) continue;
      seen[it.url] = 1;
      out.push(it);
    }
    out.sort(function (a, b) { return (LANG[String(a.lang)] || 9) - (LANG[String(b.lang)] || 9); });
    // El AJAX entrega 4-8 envoltorios; el latino (es) va primero y sólo se
    // guardan los primeros de cada idioma para no reventar el presupuesto.
    var picks = [], count = {};
    for (var j = 0; j < out.length; j++) {
      var lang = String(out[j].lang || '');
      count[lang] = (count[lang] || 0) + 1;
      if (count[lang] > 3) continue;
      picks.push(out[j]);
    }
    var jobs = [];
    for (var k = 0; k < picks.length; k++) {
      (function (srv) {
        jobs.push(_frame(srv.url, ref).then(function (frame) {
          return _resolve(frame, srv.lang === 'es' ? 'dub' : 'sub').then(function (streams) {
            for (var s = 0; s < streams.length; s++) {
              var tag = srv.lang === 'es' ? 'Latino' : 'Subtitulado';
              streams[s].kind = srv.lang === 'es' ? 'dub' : 'sub';
              streams[s].audioLang = srv.lang === 'es' ? 'es' : null;
              streams[s].label = 'Tudorama · ' + tag + ' · ' + (srv.name || '').replace(/^(?:esp|sub):/i, '');
            }
            return streams;
          });
        }).catch(function () { return []; }));
      })(picks[k]);
    }
    return Promise.all(jobs).then(function (lists) {
      var res = [], dup = {};
      for (var l = 0; l < lists.length; l++) {
        var arr = lists[l] || [];
        for (var b = 0; b < arr.length; b++) {
          var st = arr[b];
          if (!st || !st.url || dup[st.url]) continue;
          dup[st.url] = 1;
          res.push(st);
        }
      }
      if (!res.length) throw new Error('Tudorama: mirrors sin stream');
      // el latino primero
      res.sort(function (x, y) { return (x.kind === 'dub' ? 0 : 1) - (y.kind === 'dub' ? 0 : 1); });
      return _verify(res);
    });
  });
}

// Los clones de streamwish (earnvids/mochinos) devuelven rutas firmadas que a
// veces apuntan a otro nodo: se pide el master y sólo se entrega lo que da
// #EXTM3U. Los mp4 no se bajan.
function _verify(streams) {
  var jobs = [];
  for (var i = 0; i < streams.length; i++) {
    if (streams[i].container !== 'hls') continue;
    (function (st) {
      jobs.push(fetch(st.url, { headers: st.headers }).then(function (r) {
        var b = r.body || '';
        return (r.status < 400 && /#EXTM3U/.test(b)) ? st : null;
      }).catch(function () { return null; }));
    })(streams[i]);
  }
  if (!jobs.length) return streams;
  return Promise.all(jobs).then(function (res) {
    var okMap = {}, out = [];
    for (var k = 0; k < res.length; k++) if (res[k]) okMap[res[k].url] = 1;
    if (!Object.keys(okMap).length) return streams;
    for (var s = 0; s < streams.length; s++) {
      if (streams[s].container !== 'hls' || okMap[streams[s].url]) out.push(streams[s]);
    }
    return out;
  });
}

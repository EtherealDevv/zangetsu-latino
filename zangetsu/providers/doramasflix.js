// Doramasflix — fuente Zangetsu (doramas, series y películas en español latino).
// La web es Next.js, pero el catálogo sale de un GraphQL propio en
// sv1.fluxcedene.net que autentica con la cabecera x-access-platform que trae
// la app. Los enlaces online llegan como JSON y cada host se resuelve aparte.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://doramasflix.in';
var API = 'https://sv1.fluxcedene.net/api/gql';
var PLATFORM = 'RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==';
var TMDB = 'https://image.tmdb.org/t/p/w500';
var VERSION = '1.3.0';

function getInfo() {
  return {
    name: 'Doramasflix', lang: 'es', baseUrl: SITE,
    logo: 'https://assets.seriesapi.co/brands/doramasflix/websites/6a651fa138cbd16df74343be/logo/logo-1785013866419.png',
    type: 'movie', version: VERSION
  };
}

// ── red ──────────────────────────────────────────────────────────────────────
function _get(url, ref) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' };
  if (ref) h['Referer'] = ref;
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _gql(op, vars, query) {
  return fetch(API, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': SITE,
      'Referer': SITE + '/',
      'platform': 'doramasflix',
      'authorization': 'Bear',
      'x-access-jwt-token': '',
      'x-access-platform': PLATFORM
    },
    body: JSON.stringify({ operationName: op, variables: vars, query: query })
  }).then(function (r) {
    var d = null;
    try { d = JSON.parse(r.body || 'null'); } catch (e) { return null; }
    return (d && d.data) || null;
  }).catch(function () { return null; });
}

function _stream(url, quality, ref, kind) {
  var u = String(url).replace(/\\\//g, '/');
  return {
    url: u, quality: quality || 'auto',
    container: /\.m3u8(\?|$)|\/hls\d?\//i.test(u) ? 'hls' : 'mp4',
    headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' },
    kind: kind || 'dub', audioLang: 'es', subtitles: []
  };
}

// ── piezas comunes ───────────────────────────────────────────────────────────
function _poster(p) {
  if (!p) return null;
  var s = String(p);
  if (/^https?:\/\//i.test(s)) return s;
  return TMDB + (s.charAt(0) === '/' ? '' : '/') + s;
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

function _abs(url, base) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  var host = (String(base).match(/^(https?:\/\/[^/]+)/) || [])[1] || SITE;
  return host + (url.charAt(0) === '/' ? '' : '/') + url;
}

// ── resolvers por host ───────────────────────────────────────────────────────
// mxdrop / mixdrop: el reproductor llega empaquetado y la URL final vive en
// MDCore.wurl (mp4 firmado con expiración).
function _mx(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    var code = _unpack(html);
    var m = code.match(/(?:wurl|vfile)\s*=\s*["']([^"']+)["']/i) || code.match(/(?:wurl|file)\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (!m) return [];
    var u = _abs(m[1], embed);
    if (!u) return [];
    return [_stream(u, 'HD', embed, kind)];
  });
}

// vidhide / vidhidepre / vidhidevip / filelions: jwplayer con `var links={hls2:...}`.
function _vidhide(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    if (!html) return [];
    var out = [], seen = {};
    var re = /["']?hls[2-4]["']?\s*:\s*["']([^"']+)["']/gi, m;
    while ((m = re.exec(html)) !== null) {
      var u = _abs(m[1], embed);
      if (!u || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, m[0].indexOf('hls2') >= 0 ? 'HD' : 'auto', embed, kind));
    }
    if (!out.length) {
      var f = html.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/i);
      if (f) out.push(_stream(_abs(f[1], embed), 'HD', embed, kind));
    }
    return out;
  });
}

// uqload: jwplayer con la lista de sources servida en el propio HTML.
function _uq(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    var m = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (!m) return [];
    return [_stream(_abs(m[1], embed), 'HD', embed, kind)];
  });
}

// streamtape: el enlace real se arma en #norobotlink (a veces concatenado).
function _tape(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    if (!html) return [];
    var m = html.match(/norobotlink[\s\S]{0,600}?(?:href=["']|=\s*["'])((?:https?:)?\/\/[^"']*get_video\?[^"']*)/i)
      || html.match(/((?:https?:)?\/\/(?:[a-z0-9-]+\.)?streamtape\.[a-z]+\/get_video\?[^"'\s]+)/i);
    if (!m) return [];
    var u = _abs(m[1], embed);
    return [_stream(u, 'HD', embed, kind)];
  });
}

// ok.ru: la metadata del reproductor trae las variantes ya firmadas.
function _okru(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    if (!html) return [];
    var opt = html.match(/data-options="([\s\S]*?)"/i);
    if (!opt) return [];
    var raw = opt[1].replace(/&quot;/g, '"').replace(/&#0?38;/g, '&').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    var v = raw.match(/"videos"\s*:\s*\[([\s\S]*?)\]/i);
    if (!v) return [];
    var out = [], seen = {}, re = /"url"\s*:\s*"([^"]+)"/g, m;
    while ((m = re.exec(v[1])) !== null) {
      var u = m[1].replace(/\\\//g, '/');
      if (!/\.(mp4|m3u8)/i.test(u) || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, 'HD', embed, kind));
      if (out.length >= 2) break;
    }
    return out;
  });
}

// Hosts que no se pueden resolver desde el runtime: primeload exige una sesión
// con fingerprint de canvas y un socket para firmar el m3u8; do7go, playmogo y
// dood están detrás de Cloudflare managed challenge.
function _deadHost(u) {
  return /primeload|do7go|playmogo|dood\./i.test(String(u));
}

// Clones de streamwish (flaswish, vidhidepre, vidhidevip, sfastwish…): el
// reproductor llega empaquetado y deja la lista en `var links={hls4,hls3,hls2}`
// usando `hls4||hls3||hls2`; las rutas relativas van contra el propio embed.
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

function _swish(embed, kind) {
  return _get(embed, SITE + '/').then(function (html) {
    if (!html) return [];
    var code = _unpack(html);
    var obj = (code.match(/links\s*=\s*\{([\s\S]*?)\}\s*;/) || [])[1] || '';
    var out = [], seen = {}, order = ['hls4', 'hls3', 'hls2', 'hls', 'file'], o;
    for (o = 0; o < order.length; o++) {
      var m = obj.match(new RegExp('["\']?' + order[o] + '["\']?\\s*:\\s*["\']([^"\']+)["\']'));
      if (!m) continue;
      var u = _abs(m[1], embed);
      if (!u || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, o <= 1 ? 'HD' : 'auto', embed, kind));
    }
    if (!out.length) {
      var f = code.match(/(?:file|src)\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i)
        || html.match(/(?:file|src)\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
      if (f) out.push(_stream(_abs(f[1], embed), 'HD', embed, kind));
    }
    return out;
  });
}

function _resolve(embed, kind) {
  var u = String(embed || '').replace(/\\\//g, '/').replace(/#.*$/, '');
  if (!u || _deadHost(u)) return Promise.resolve([]);
  if (/voe\.|susanexpectcare/i.test(u)) return _voe(u, kind);
  if (/byse/i.test(u)) return _byse(u, kind);
  if (/mxdrop|mixdrop/i.test(u)) return _mx(u, kind);
  if (/uqload/i.test(u)) return _uq(u, kind);
  if (/streamtape|strtape/i.test(u)) return _tape(u, kind);
  if (/ok\.ru/i.test(u)) return _okru(u, kind);
  if (/vidhide|filelions|flaswish|sfastwish|wishfast|jodwish|streamwish|myvidplay|vudeo/i.test(u)) return _swish(u, kind);
  return _swish(u, kind);
}

// ── catálogo ─────────────────────────────────────────────────────────────────
var Q_ITEM = '_id name name_es slug poster_path poster __typename';

function _item(e, isMovie) {
  if (!e || !e.slug) return null;
  var title = e.name || e.name_es || e.slug;
  var alt = (e.name_es && e.name_es !== title) ? e.name_es : null;
  return {
    id: SITE + (isMovie ? '/peliculas-online/' : '/doramas-online/') + e.slug,
    title: title,
    englishTitle: alt,
    cover: _poster(e.poster_path || e.poster),
    url: SITE + (isMovie ? '/peliculas-online/' : '/doramas-online/') + e.slug,
    type: isMovie ? 'movie' : 'tv',
    sourceId: __SOURCE_ID
  };
}

function _listDoramas(page, sort, filter) {
  return _gql('listDoramas', { page: page, perPage: 24, sort: sort || 'POPULARITY_DESC', filter: filter || {} },
    'query listDoramas($page: Int, $perPage: Int, $sort: SortFindManyDoramaInput, $filter: FilterFindManyDoramaInput) { paginationDorama(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { ' + Q_ITEM + ' } } }'
  ).then(function (d) {
    var items = (d && d.paginationDorama && d.paginationDorama.items) || [], out = [];
    for (var i = 0; i < items.length; i++) {
      var it = _item(items[i], false);
      if (it) out.push(it);
    }
    return out;
  });
}

function _listMovies(page, sort) {
  return _gql('listMovies', { page: page, perPage: 24, sort: sort || 'POPULARITY_DESC', filter: {} },
    'query listMovies($page: Int, $perPage: Int, $sort: SortFindManyMovieInput, $filter: FilterFindManyMovieInput) { paginationMovie(page: $page, perPage: $perPage, sort: $sort, filter: $filter) { items { ' + Q_ITEM + ' } } }'
  ).then(function (d) {
    var items = (d && d.paginationMovie && d.paginationMovie.items) || [], out = [];
    for (var i = 0; i < items.length; i++) {
      var it = _item(items[i], true);
      if (it) out.push(it);
    }
    return out;
  });
}

function getHome() {
  return Promise.all([
    _listDoramas(1, 'POPULARITY_DESC').then(function (i) { return { title: 'Doramas populares', items: i }; }),
    _listDoramas(1, 'CREATEDAT_DESC').then(function (i) { return { title: 'Recién agregados', items: i }; }),
    _listMovies(1, 'POPULARITY_DESC').then(function (i) { return { title: 'Películas', items: i }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _listDoramas(page, 'POPULARITY_DESC').catch(function () { return []; });
}

function latest(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _listDoramas(page, 'CREATEDAT_DESC').catch(function () { return []; });
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
// El puntaje mira título y alias (name_es), y los que no coinciden se conservan
// detrás: antes se perdían porque ya traían englishTitle de la ficha.
function _zAlias(items, query) {
  var q = _zNorm(query);
  if (!q || !items || !items.length) return items;
  var qt = q.split(' ').filter(function (t) { return t.length >= 4; });
  if (!qt.length) return items;
  var need = qt.length <= 3 ? qt.length : Math.ceil(qt.length * 0.75);
  var scored = [], i;
  for (i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || !it.title) continue;
    var tt = (_zNorm(it.title) + ' ' + _zNorm(it.englishTitle || '')).split(' ');
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
    if (covered < need) continue;
    it.englishTitle = query;
    scored.push({ it: it, score: score, words: tt.length, at: i });
  }
  if (!scored.length) return items;
  scored.sort(function (x, y) {
    if (y.score !== x.score) return y.score - x.score;
    if (x.words !== y.words) return x.words - y.words;
    return x.at - y.at;
  });
  var out = [], used = {};
  for (var s = 0; s < scored.length; s++) { out.push(scored[s].it); used[scored[s].at] = 1; }
  for (var k = 0; k < items.length; k++) if (!used[k]) out.push(items[k]);
  return out;
}

// El API busca por nombre original y por name_es, pero ordena por relevancia
// difusa: un título localizado distinto al del sitio puede quedar fuera del
// filtro de Z Mode. La cascada va de la señal más fuerte a la más débil y sólo
// paga los pasos caros cuando los baratos no alcanzan.
function _searchQ(q) {
  return _gql('searchAll', { input: q },
    'query searchAll($input: String!) { searchDorama(input: $input, limit: 32) { ' + Q_ITEM + ' } searchMovie(input: $input, limit: 32) { ' + Q_ITEM + ' } }'
  ).then(function (d) {
    if (!d) return [];
    var out = [], seen = {}, i;
    var series = d.searchDorama || [];
    for (i = 0; i < series.length; i++) {
      var a = _item(series[i], false);
      if (a && !seen[a.url]) { seen[a.url] = 1; out.push(a); }
    }
    var movies = d.searchMovie || [];
    for (i = 0; i < movies.length; i++) {
      var b = _item(movies[i], true);
      if (b && !seen[b.url]) { seen[b.url] = 1; out.push(b); }
    }
    return out;
  }).catch(function () { return []; });
}

function _merge(lists) {
  var out = [], seen = {}, i, k;
  for (i = 0; i < lists.length; i++) {
    for (k = 0; k < (lists[i] || []).length; k++) {
      var it = lists[i][k];
      if (!it || !it.url || seen[it.url]) continue;
      seen[it.url] = 1;
      out.push(it);
    }
  }
  return out;
}

function _tr(q, tl) {
  var u = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + tl
    + '&dt=t&q=' + encodeURIComponent(q);
  return fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' } }).then(function (r) {
    var j = null;
    try { j = JSON.parse(r.body || '[]'); } catch (e) { return ''; }
    var seg = (j && j[0]) || [], out = '';
    for (var i = 0; i < seg.length; i++) if (seg[i] && seg[i][0]) out += seg[i][0];
    return out.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }).catch(function () { return ''; });
}

// Igualdad normalizada: el nombre que el sitio ya tiene, tal cual lo pidió el
// usuario. Es la señal más fuerte, sin importar cómo quedó ordenada la lista.
function _exactHit(items, query) {
  var q = _zNorm(query);
  if (!q) return null;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it) continue;
    if (_zNorm(it.title) === q || _zNorm(it.englishTitle || '') === q) return it;
  }
  return null;
}

// Primer item que cubre la consulta; `_zAlias` sólo reordena, esto dice si hay
// algo que el filtro de título de la app vaya a aceptar.
function _zTake(items, query) {
  var q = _zNorm(query);
  if (!q || !items || !items.length) return null;
  var qt = q.split(' ').filter(function (t) { return t.length >= 4; });
  if (!qt.length) return null;
  var need = qt.length <= 3 ? qt.length : Math.ceil(qt.length * 0.75);
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it) continue;
    var tt = (_zNorm(it.title) + ' ' + _zNorm(it.englishTitle || '')).split(' ');
    var covered = 0;
    for (var a = 0; a < qt.length; a++) {
      for (var b = 0; b < tt.length; b++) {
        var w = tt[b];
        if (w.length < 4) continue;
        if (w === qt[a] || w.indexOf(qt[a]) === 0 || qt[a].indexOf(w) === 0) { covered++; break; }
      }
    }
    if (covered >= need) return it;
  }
  return null;
}

// El título del sitio se conserva; la consulta va en englishTitle, que es lo que
// el filtro de Z Mode compara cuando el usuario trae el título "equivocado".
function _mark(items, hit, query) {
  var out = [], k;
  hit.englishTitle = query;
  out.push(hit);
  for (k = 0; k < items.length; k++) if (items[k] && items[k].url !== hit.url) out.push(items[k]);
  return out;
}

function _stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}

// Sólo se paga el puente cuando la consulta viene en español: las consultas en
// inglés ya las resuelve el buscador del sitio.
var _ES_STOP = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'que', 'en',
  'y', 'con', 'por', 'para', 'mi', 'tu', 'su', 'al', 'se', 'es', 'mas', 'como', 'pero', 'muy',
  'ya', 'sin', 'sobre', 'entre', 'cuando', 'donde', 'otra', 'otro', 'esta', 'este'];

function _looksSpanish(q) {
  if (/[áéíóúñü¿¡]/i.test(String(q))) return true;
  var w = _zNorm(q).split(' '), i;
  for (i = 0; i < w.length; i++) if (_ES_STOP.indexOf(w[i]) >= 0) return true;
  return false;
}

// Último recurso: el título localizado no existe en Doramasflix de forma
// reconocible, pero la ficha de Tudorama sí lo conoce y su slug ES el título
// original en inglés. Se lee ese slug y se busca el original aquí.
function _bridge(q) {
  var u = 'https://tudorama.com/?s=' + encodeURIComponent(q);
  return fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' } }).then(function (r) {
    if (!r || r.status >= 400) return [];
    var chunk = String(r.body || '').split(/<article class="ipst/)[1];
    if (!chunk) return [];
    chunk = chunk.split(/<\/article>/)[0];
    var slug = (chunk.match(/https?:\/\/tudorama\.com\/(?:serie|pelicula)\/([^"\/]+)\//i) || [])[1] || '';
    var h1 = _stripTags((chunk.match(/class="ipst__title"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) || [])[1] || '');
    var out = [], i, t, alts = [];
    if (slug) alts.push(slug.replace(/-/g, ' '));
    if (h1) alts.push(h1);
    for (i = 0; i < alts.length; i++) {
      t = alts[i];
      if (t && out.indexOf(t) < 0) out.push(t);
    }
    return out;
  }).catch(function () { return []; });
}

function _fromAlts(alts, pool, q) {
  if (!alts || !alts.length) return Promise.resolve(null);
  var i, probes = [], tried = {};
  for (i = 0; i < alts.length && probes.length < 2; i++) {
    if (!alts[i] || _zNorm(alts[i]) === _zNorm(q) || tried[_zNorm(alts[i])]) continue;
    tried[_zNorm(alts[i])] = 1;
    probes.push(_searchQ(alts[i]));
  }
  if (!probes.length) return Promise.resolve(null);
  return Promise.all(probes).then(function (lists) {
    var all = _merge([pool].concat(lists)), found = null;
    for (i = 0; i < alts.length && !found; i++) found = _exactHit(all, alts[i]);
    if (!found) found = _zTake(all, alts[0]);
    return found ? { items: all, hit: found } : null;
  });
}

function search(query, page) {
  var q = String(query || '').replace(/^\s+|\s+$/g, '');
  if (!q) return Promise.resolve([]);
  return _searchQ(q).then(function (base) {
    var direct = _exactHit(base, q);
    if (direct) return _mark(base, direct, q);
    var fuzzy = _zTake(base, q);
    if (!_looksSpanish(q)) return fuzzy ? _zAlias(base, q) : _deepSearch(base, q);
    // Título localizado que el sitio no tiene tal cual: el puente dice cuál es
    // el original y esa ficha gana sobre el parecido léxico.
    return _bridge(q).then(function (alts) {
      if (!alts.length) return fuzzy ? _zAlias(base, q) : _deepSearch(base, q);
      return _fromAlts(alts, base, q).then(function (found) {
        if (found) return _mark(found.items, found.hit, q);
        if (fuzzy) return _zAlias(base, q);
        return _deepSearch(base, q);
      });
    });
  }).catch(function () { return []; });
}

// Traducción es↔en para los títulos que no son el del sitio ni el original.
function _deepSearch(base, q) {
  return Promise.all([_tr(q, 'en'), _tr(q, 'es')]).then(function (tr) {
    var en = tr[0], es = tr[1], jobs = [];
    if (en && _zNorm(en) !== _zNorm(q)) jobs.push(_searchQ(en));
    if (es && _zNorm(es) !== _zNorm(q)) jobs.push(_searchQ(es));
    return Promise.all(jobs).then(function (more) {
      var all = _merge([base].concat(more)), hit = null;
      hit = _exactHit(all, q) || (en && _exactHit(all, en)) || (es && _exactHit(all, es)) || null;
      if (!hit) hit = _zTake(all, q) || (en && _zTake(all, en)) || (es && _zTake(all, es)) || null;
      if (hit) return _mark(all, hit, q);
      return all.length ? _zAlias(all, q) : [];
    });
  }).catch(function () { return base.length ? _zAlias(base, q) : []; });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _isMovieUrl(url) {
  return /\/peliculas-online\//i.test(String(url));
}

function _slug(url) {
  var s = String(url).replace(/[?#].*$/, '').replace(/\/+$/, '');
  return s.slice(s.lastIndexOf('/') + 1);
}

function _episodes(doramaId, slug, seasons) {
  var jobs = [], nums = [];
  for (var i = 0; i < seasons.length && i < 12; i++) {
    (function (n) {
      nums.push(n);
      jobs.push(_gql('listEpisodes', { serie_id: doramaId, season_number: n },
        'query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id name slug episode_number season_number still_path __typename } }'
      ));
    })(seasons[i]);
  }
  return Promise.all(jobs).then(function (lists) {
    var out = [], seen = {};
    for (var l = 0; l < lists.length; l++) {
      var arr = (lists[l] && lists[l].listEpisodes) || [];
      for (var k = 0; k < arr.length; k++) {
        var e = arr[k];
        if (!e || !e._id) continue;
        var n = e.episode_number || 0;
        var id = SITE + '/ver/' + slug + '/' + nums[l] + '/' + n + '?e=' + e._id;
        if (seen[id]) continue;
        seen[id] = 1;
        out.push({
          id: id, url: id,
          title: 'T' + nums[l] + ' · Cap ' + n + (e.name && e.name.indexOf(String(n)) < 0 ? ' — ' + e.name : ''),
          number: n, season: nums[l],
          cover: _poster(e.still_path), sourceId: __SOURCE_ID
        });
      }
    }
    return out;
  });
}

function _detail(url) {
  var slug = _slug(url);
  if (!slug) return Promise.reject(new Error('Doramasflix: enlace inválido'));
  if (_isMovieUrl(url)) {
    return _gql('detailMovie', { filter: { slug: slug } },
      'query detailMovie($filter: FilterFindOneMovieInput) { detailMovie(filter: $filter) { _id name name_es slug overview poster_path poster release_date runtime genres { name } __typename } }'
    ).then(function (d) {
      var m = (d && d.detailMovie) || null;
      if (!m) throw new Error('Doramasflix: película no encontrada');
      var self = SITE + '/peliculas-online/' + m.slug;
      var genres = [];
      for (var i = 0; i < (m.genres || []).length; i++) genres.push(String(m.genres[i] && m.genres[i].name || ''));
      return {
        id: self, title: m.name || m.name_es, englishTitle: (m.name_es && m.name_es !== m.name) ? m.name_es : null,
        url: self, cover: _poster(m.poster_path || m.poster),
        description: m.overview || '', genres: genres, studios: [],
        status: 'completed', year: (String(m.release_date || '').match(/^(\d{4})/) || [])[1] || null,
        duration: m.runtime || null,
        type: 'movie', sourceId: __SOURCE_ID,
        episodes: [{ id: self, url: self, title: 'Ver película', number: 1, sourceId: __SOURCE_ID }],
        subCount: 0, dubCount: 1
      };
    });
  }
  return _gql('detailDorama', { filter: { slug: slug } },
    'query detailDorama($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { _id name name_es slug overview poster_path poster first_air_date status genres { name } __typename } }'
  ).then(function (d) {
    var s = (d && d.detailDorama) || null;
    if (!s) throw new Error('Doramasflix: dorama no encontrado');
    return _gql('listSeasons', { serie_id: s._id },
      'query listSeasons($serie_id: MongoID!) { listSeasons(sort: NUMBER_ASC, filter: {serie_id: $serie_id}) { slug season_number poster_path __typename } }'
    ).then(function (sd) {
      var seasons = (sd && sd.listSeasons) || [];
      var nums = [];
      for (var i = 0; i < seasons.length; i++) {
        var n = seasons[i].season_number;
        if (n !== null && n !== undefined && nums.indexOf(n) < 0) nums.push(n);
      }
      if (!nums.length) nums = [1];
      var self = SITE + '/doramas-online/' + s.slug;
      var genres = [];
      for (var g = 0; g < (s.genres || []).length; g++) genres.push(String(s.genres[g] && s.genres[g].name || ''));
      return _episodes(s._id, s.slug, nums).then(function (eps) {
        return {
          id: self, title: s.name || s.name_es, englishTitle: (s.name_es && s.name_es !== s.name) ? s.name_es : null,
          url: self, cover: _poster(s.poster_path || s.poster),
          description: s.overview || '', genres: genres, studios: [],
          status: 'completed', year: (String(s.first_air_date || '').match(/^(\d{4})/) || [])[1] || null,
          type: 'tv', sourceId: __SOURCE_ID,
          episodes: eps,
          subCount: 0, dubCount: eps.length
        };
      });
    });
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
var LANG = {
  '38': 'Latino', '37': 'Castellano', '36': 'Inglés', '192': 'Subtitulado',
  '13109': 'Coreano', '13110': 'Japonés', '13111': 'Mandarín', '13112': 'Tailandés',
  '13113': 'Filipino', '13114': 'Indonesio', '1327': 'Portugués', '343422': 'Vietnamita'
};

function _langOf(link) {
  var code = String(link.language_code || '').toLowerCase();
  var lab = LANG[String(link.lang || '')] || '';
  if (code === 'es') return lab === 'Castellano' ? 'Castellano' : 'Latino';
  if (code === 'pt-br' || code === 'pt') return 'Portugués';
  if (code === 'en') return 'Inglés';
  return lab || (code ? code.toUpperCase() : 'Subtitulado');
}

// Junta los servidores de las dos consultas (el oficial y los externos), deja
// los latinos al frente y resuelve cada host en paralelo.
function _servers(list, kind) {
  var out = [], seen = {}, i;
  for (i = 0; i < list.length; i++) {
    var it = list[i];
    if (!it) continue;
    var url = it.embed || it.link;
    if (!url || _deadHost(url) || seen[url]) continue;
    seen[url] = 1;
    out.push({ url: url, lang: it.language_code || '', label: _langOf(it), kind: kind });
  }
  out.sort(function (a, b) {
    var sa = a.label === 'Latino' ? 0 : (a.label === 'Castellano' ? 1 : 2);
    var sb = b.label === 'Latino' ? 0 : (b.label === 'Castellano' ? 1 : 2);
    return sa - sb;
  });
  return out;
}

function getVideoSources(url) {
  var target = String(url || '');
  var isMovie = _isMovieUrl(target);
  var epId = (target.match(/[?&]e=([0-9a-f]{24})/i) || [])[1] || '';
  var slug = _slug(target);

  if (isMovie) {
    return Promise.all([
      _gql('getMovieLinks', { slug: slug }, 'query getMovieLinks($slug: String) { getMovieLinks(slug: $slug) { _id links_online } }'),
      _gql('detailMovie', { filter: { slug: slug } }, 'query detailMovie($filter: FilterFindOneMovieInput) { detailMovie(filter: $filter) { _id links_online } }')
    ]).then(function (res) {
      var list = [];
      for (var i = 0; i < res.length; i++) {
        var node = (res[i] && (res[i].getMovieLinks || res[i].detailMovie)) || null;
        var links = (node && node.links_online) || [];
        for (var k = 0; k < links.length; k++) list.push(links[k]);
      }
      return _collect(list, 'dub');
    });
  }

  if (!epId) return Promise.reject(new Error('Doramasflix: episodio sin identificador'));
  return Promise.all([
    _gql('detailEpisode', { filter: { _id: epId } }, 'query detailEpisode($filter: FilterFindOneEpisodeInput) { detailEpisode(filter: $filter) { _id links_online } }'),
    _gql('getEpisodeLinks', { id: epId }, 'query getEpisodeLinks($id: MongoID!) { getEpisodeLinks(id: $id) { _id links_online } }')
  ]).then(function (res) {
    var list = [];
    for (var i = 0; i < res.length; i++) {
      var node = (res[i] && (res[i].detailEpisode || res[i].getEpisodeLinks)) || null;
      var links = (node && node.links_online) || [];
      for (var k = 0; k < links.length; k++) list.push(links[k]);
    }
    return _collect(list, 'dub');
  });
}

function _collect(list, kind) {
  var servers = _servers(list, kind);
  if (!servers.length) throw new Error('Doramasflix: sin servidores vivos');

  var picks = servers.slice(0, 10), jobs = [];
  for (var i = 0; i < picks.length; i++) jobs.push(_resolve(picks[i].url, picks[i].kind));

  return Promise.all(jobs).then(function (lists) {
    var out = [], dup = {};
    for (var j = 0; j < lists.length; j++) {
      var arr = lists[j] || [];
      for (var k = 0; k < arr.length; k++) {
        var st = arr[k];
        if (!st || !st.url || dup[st.url]) continue;
        dup[st.url] = 1;
        var tag = picks[j].label;
        var sub = tag !== 'Latino' && tag !== 'Castellano';
        st.kind = sub ? 'sub' : 'dub';
        st.audioLang = sub ? null : 'es';
        st.label = 'Doramasflix · ' + tag + ' · ' + (st.container === 'hls' ? 'HLS' : 'MP4');
        out.push(st);
      }
    }
    if (!out.length) throw new Error('Doramasflix: mirrors sin stream');
    return _verify(out);
  });
}

// Los clones de streamwish devuelven rutas firmadas que a veces pertenecen a
// otro nodo del CDN: se pide el master y sólo se entrega lo que responde
// #EXTM3U. Los mp4 no se tocan (serían cientos de MB en memoria).
function _verify(streams) {
  var jobs = [], hls = [];
  for (var i = 0; i < streams.length; i++) {
    if (streams[i].container !== 'hls') continue;
    hls.push(streams[i]);
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

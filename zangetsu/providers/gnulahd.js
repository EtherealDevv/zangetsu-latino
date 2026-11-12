// GnulaHD — fuente Zangetsu (películas en español latino y subtitulado).
// WordPress + plantilla propia: el reproductor lo sirve /wp-json/gnrd/v1/player
// con un payload base64 + XOR, que trae los servidores por idioma.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://ww3.gnulahd.nu';
var VERSION = '1.0.0';

function getInfo() {
  return {
    name: 'GnulaHD', lang: 'es', baseUrl: SITE,
    logo: SITE + '/favicon.ico', type: 'movie', version: VERSION
  };
}

// ── red ──────────────────────────────────────────────────────────────────────
function _get(url, ref, extra) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' };
  if (ref) h['Referer'] = ref;
  if (extra) { for (var k in extra) h[k] = extra[k]; }
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _stream(url, quality, ref, kind) {
  var u = String(url).replace(/\\\//g, '/');
  return {
    url: u, quality: quality || 'auto',
    container: /\.m3u8(\?|$)/i.test(u) ? 'hls' : 'mp4',
    headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' },
    kind: kind || 'dub', audioLang: 'es', subtitles: []
  };
}

// ── payload del reproductor ──────────────────────────────────────────────────
// gnrdUnpack: atob(s) y XOR con la clave "gN7d". Sin atob en el runtime, así
// que base64ToBytes + decodificador UTF-8 propio (los embeds traen acentos).
function _utf8(bytes) {
  var s = '', i = 0, c, cp;
  while (i < bytes.length) {
    c = bytes[i++];
    if (c < 0x80) s += String.fromCharCode(c);
    else if (c < 0xE0) s += String.fromCharCode(((c & 0x1F) << 6) | (bytes[i++] & 0x3F));
    else if (c < 0xF0) s += String.fromCharCode(((c & 0x0F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F));
    else {
      cp = ((c & 0x07) << 18) | ((bytes[i++] & 0x3F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F);
      cp -= 0x10000;
      s += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
    }
  }
  return s;
}

function _gnrd(payload) {
  var raw = base64ToBytes(String(payload || ''));
  var key = [103, 78, 55, 100];
  var out = [];
  for (var i = 0; i < raw.length; i++) out.push((raw[i] ^ key[i & 3]) & 255);
  return JSON.parse(_utf8(out));
}

// ── resolvers ────────────────────────────────────────────────────────────────
// streamwish / vidara / filelions family: página con jwplayer alimentado por
// POST /api/stream {filecode}. Una petición, JSON plano, sin packer.
function _api(embed, ref, kind) {
  var u = String(embed).replace(/\\\//g, '/').replace(/#.*$/, '');
  var host = (u.match(/^(https?:\/\/[^/]+)/) || [])[1] || '';
  var parts = u.split('?')[0].split('/').filter(function (x) { return !!x; });
  var code = parts[parts.length - 1] || '';
  if (!host || !code) return Promise.resolve([]);
  var body = JSON.stringify({
    filecode: code, device: 'android',
    codecs: { av1: 'av01.0.09M.10', h265: 'hvc1.1.6.L123.B0' }
  });
  return fetch(host + '/api/stream', {
    method: 'POST',
    headers: {
      'User-Agent': UA, 'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': host, 'Referer': host + '/e/' + code
    },
    body: body
  }).then(function (r) {
    var d = null;
    try { d = JSON.parse(r.body || 'null'); } catch (e) { return []; }
    if (!d || !d.streaming_url) return [];
    var out = [_stream(d.streaming_url, 'HD', embed, kind)];
    var subs = d.subtitles || [];
    for (var i = 0; i < subs.length && i < 4; i++) {
      var t = subs[i];
      if (!t || !t.file_path) continue;
      out[0].subtitles.push({ url: t.file_path, lang: String(t.language || 'en').slice(0, 2).toLowerCase(), label: t.language || null });
    }
    return out;
  }).catch(function () { return []; });
}

// Hosts que no resuelven dentro del presupuesto de Z Mode: voe (Altcha con
// PBKDF2) y savefiles (Cloudflare). Se saltan en vez de gastar el turno.
function _deadHost(u) {
  return /voe\.|savefiles|dood|dsvplay|ds2play|playmogo|streamtape/i.test(String(u));
}

// ── catálogo ─────────────────────────────────────────────────────────────────
function _cards(html) {
  var out = [], seen = {};
  var chunks = String(html || '').split(/<a class="gnrd-card"/i);
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i].split(/<\/a>/i)[0];
    var href = (c.match(/href="([^"]+)"/i) || [])[1] || '';
    var url = absUrl(href, SITE);
    if (!url || seen[url]) continue;
    var title = htmlText((c.match(/title="([^"]*)"/i) || [])[1] || '')
      || htmlText((c.match(/class="gnrd-card-title"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '');
    if (!title) continue;
    var img = c.match(/<img\b[^>]*>/i);
    var cover = img ? ((img[0].match(/src="([^"]+)"/i) || [])[1] || '') : '';
    seen[url] = 1;
    out.push({ id: url, title: title, cover: cover || null, url: url, type: 'movie', sourceId: __SOURCE_ID });
  }
  return out;
}

function _list(path) {
  return _get(SITE + path, SITE + '/').then(_cards);
}

function getHome() {
  return Promise.all([
    _list('/ver/peliculas/').then(function (items) { return { title: 'Películas', items: items }; }),
    _list('/ver/peliculas/?page=2').then(function (items) { return { title: 'Recién añadidas', items: items }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _list('/ver/peliculas/' + (page > 1 ? '?page=' + page : '')).catch(function () { return []; });
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

function _zAlias(items, query) {
  var q = _zNorm(query);
  if (!q || !items || !items.length) return items;
  var qt = q.split(' ').filter(function (t) { return t.length >= 4; });
  if (!qt.length) return items;
  // Con una sola palabra no se acepta coincidencia por prefijo: "The Simpsons"
  // marcaría cualquier especial ("Los Simpson: Simpsley") y Gnula no tiene la
  // serie, así que el usuario acabaría viendo el especial equivocado.
  var exactOnly = qt.length === 1;
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
        if (!exactOnly && best < 1 && (w.indexOf(qt[a]) === 0 || qt[a].indexOf(w) === 0)) best = 1;
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

// Gnula lista series, anime y películas en el mismo buscador, y sus páginas de
// serie no traen reproductor (la lista de episodios se arma por JS). Se
// verifican los primeros resultados en paralelo (~1 s por tanda) y se descartan
// los que son TVSeries; si el detalle no contesta, el resultado se conserva.
function _kindOf(html) {
  if (!html) return 'unknown';
  if (/"_?gnrdPid"\s*=\s*\d+|_gnrdPid\s*=\s*\d+/.test(html)) return 'movie';
  if (/"@type"\s*:\s*"TVSeries"/.test(html)) return 'tv';
  if (/"@type"\s*:\s*"Movie"/.test(html)) return 'movie';
  return 'unknown';
}

function _verify(items, cap) {
  var picks = items.slice(0, cap), jobs = [], i;
  for (i = 0; i < picks.length; i++) {
    jobs.push(_get(picks[i].url, SITE + '/').then(_kindOf).catch(function () { return 'unknown'; }));
  }
  return Promise.all(jobs).then(function (kinds) {
    var out = [], tv = 0;
    for (i = 0; i < picks.length; i++) {
      if (kinds[i] === 'tv') { tv++; continue; }
      out.push(picks[i]);
    }
    for (i = picks.length; i < items.length; i++) out.push(items[i]);
    // Todo el bloque era serie: la fuente no tiene nada que reproducir.
    if (!out.length && tv === picks.length && picks.length) return [];
    return out;
  });
}

function _searchOnce(q, page) {
  var p = page > 1 ? '&paged=' + page : '';
  return _get(SITE + '/?s=' + encodeURIComponent(q) + p, SITE + '/').then(_cards).catch(function () { return []; });
}

function _hasExact(items, query) {
  var q = _zNorm(query);
  for (var i = 0; i < items.length; i++) if (_zNorm(items[i].title) === q) return true;
  return false;
}

function _merge(lists) {
  var out = [], seen = {};
  for (var l = 0; l < lists.length; l++) {
    var arr = lists[l] || [];
    for (var k = 0; k < arr.length; k++) {
      var it = arr[k];
      if (!it || !it.url || seen[it.url]) continue;
      seen[it.url] = 1; out.push(it);
    }
  }
  return out;
}

// El buscador propio no recorta plurales: "The Simpsons" deja la serie fuera
// de los primeros puestos. Los recortes se piden en paralelo y se funden, no
// reemplazan; después se descartan las series (no tienen reproductor).
function search(query, page) {
  return _searchOnce(query, page).then(function (first) {
    if (_hasExact(first, query)) return _verify(first, 8).then(function (kept) { return _zAlias(kept, query); });
    var alts = _searchFallbacks(query);
    if (!alts.length) return _verify(first, 8).then(function (kept) { return _zAlias(kept, query); });
    var jobs = [Promise.resolve(first)];
    for (var i = 0; i < alts.length; i++) jobs.push(_searchOnce(alts[i], page));
    return Promise.all(jobs).then(function (lists) {
      return _verify(_merge(lists), 8);
    }).then(function (kept) { return _zAlias(kept, query); });
  });
}

function _searchFallbacks(query) {
  var out = [];
  var low = _zNorm(query);
  var bare = low.replace(/^(the|a|an|el|la|los|las|un|una) /, '');
  if (bare && bare !== low) out.push(bare);
  var stem = bare.split(' ').map(function (t) {
    return (t.length > 4 && /s$/.test(t)) ? t.slice(0, -1) : t;
  }).join(' ');
  if (stem && stem !== bare && out.indexOf(stem) < 0) out.push(stem);
  return out.slice(0, 2);
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _ldJson(html) {
  var m = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return null; }
}

function _genres(html) {
  var m = html.match(/"genre"\s*:\s*(\[[^\]]*\]|"[^"]*")/i);
  if (!m) return [];
  var raw = m[1], out = [], re = /"([^"]+)"/g, g;
  while ((g = re.exec(raw)) !== null) if (g[1] && out.indexOf(g[1]) < 0) out.push(g[1]);
  return out;
}

function _detail(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('GnulaHD: sin respuesta');

    var title = htmlText((html.match(/class="gnrd-sr"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '');
    if (!title) title = htmlText((html.match(/<h1[^>]*>[\s\S]*?<img[^>]*alt="([^"]*)"/i) || [])[1] || '');
    if (!title) {
      title = htmlText((html.match(/property="og:title" content="([^"]*)"/i) || [])[1] || '');
      title = title.replace(/\s*\((19|20)\d{2}\).*$/i, '').replace(/\s*[-–|]\s*gnula.*$/i, '');
    }
    if (!title) title = htmlText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');

    var cover = (html.match(/property="og:image" content="([^"]*)"/i) || [])[1] || null;

    var desc = htmlText((html.match(/itemprop="description"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/i) || [])[1] || '');
    if (!desc) {
      var ld = _ldJson(html);
      if (ld) desc = htmlText(ld.description || '');
    }

    var year = ((html.match(/property="og:title" content="[^"]*?\((\d{4})\)/i) || [])[1])
      || ((html.match(/itemprop="datePublished"[^>]*content="(\d{4})/i) || [])[1]) || null;

    var eps = [{ id: url, title: 'Ver película', number: 1, url: url }];

    return {
      id: url, title: title, url: url, cover: cover,
      description: desc, genres: _genres(html), studios: [],
      status: 'completed', year: year,
      type: 'movie', sourceId: __SOURCE_ID,
      episodes: eps, subCount: 0, dubCount: eps.length
    };
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
function getVideoSources(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('GnulaHD: sin respuesta');
    var pid = (html.match(/_gnrdPid\s*=\s*(\d+)/) || [])[1];
    var tok = (html.match(/_gnrdTok\s*=\s*"([^"]*)"/) || [])[1] || '';
    if (!pid) throw new Error('GnulaHD: sin reproductor (¿serie?)');

    var origin = (url.match(/^(https?:\/\/[^/]+)/) || [])[1] || SITE;
    var api = origin + '/wp-json/gnrd/v1/player?id=' + pid + '&t=' + encodeURIComponent(tok);

    return _get(api, url, { 'Accept': 'application/json' }).then(function (body) {
      var payload = '';
      try { payload = (JSON.parse(body) || {}).p || ''; } catch (e) { payload = ''; }
      if (!payload) throw new Error('GnulaHD: payload vacío');

      var data = null;
      try { data = _gnrd(payload); } catch (e) { throw new Error('GnulaHD: payload ilegible'); }
      var langs = (data && data.langs) || [];

      // Latino primero; el matcher de Z Mode elige el primer stream que abre.
      var order = [];
      for (var i = 0; i < langs.length; i++) {
        var lab = String(langs[i].label || '').toLowerCase();
        if (lab.indexOf('latino') >= 0) order.unshift(langs[i]);
        else order.push(langs[i]);
      }

      var jobs = [], refs = [], kinds = [];
      for (var l = 0; l < order.length && refs.length < 6; l++) {
        var kind = String(order[l].label || '').toLowerCase().indexOf('latino') >= 0 ? 'dub' : 'sub';
        var srv = order[l].servers || [];
        for (var s = 0; s < srv.length && refs.length < 6; s++) {
          var src = srv[s] && srv[s].src;
          if (!src || _deadHost(src)) continue;
          refs.push(src);
          kinds.push(kind);
          jobs.push(_api(src, url, kind));
        }
      }
      if (!jobs.length) throw new Error('GnulaHD: servidores muertos');

      return Promise.all(jobs).then(function (lists) {
        var out = [], dup = {};
        for (var j = 0; j < lists.length; j++) {
          var arr = lists[j] || [];
          for (var k = 0; k < arr.length; k++) {
            var st = arr[k];
            if (!st || !st.url || dup[st.url]) continue;
            dup[st.url] = 1;
            st.label = 'Gnula · ' + (kinds[j] === 'dub' ? 'Latino' : 'Subtitulado') + ' · ' + (st.container === 'hls' ? 'HLS' : 'MP4');
            out.push(st);
          }
        }
        if (!out.length) throw new Error('GnulaHD: mirror sin stream');
        return out;
      });
    });
  });
}

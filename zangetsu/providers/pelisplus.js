// PelisPlus — fuente Zangetsu (películas y series en español latino).
// Tema apk-web sobre WordPress: los listados traen las fichas en <li class="xxx
// TPostMv"> y el reproductor de /play/ entrega un mp4 directo por videojs,
// sin packer ni cifrado.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://pelisplus2.vip';
var VERSION = '1.0.0';

function getInfo() {
  return {
    name: 'PelisPlus', lang: 'es', baseUrl: SITE,
    logo: SITE + '/favicon.ico', type: 'movie', version: VERSION
  };
}

// ── red ──────────────────────────────────────────────────────────────────────
function _get(url, ref) {
  var h = { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' };
  if (ref) h['Referer'] = ref;
  return fetch(url, { headers: h }).then(function (r) { return r.body || ''; }).catch(function () { return ''; });
}

function _stream(url, quality, ref) {
  var u = String(url).replace(/\\\//g, '/');
  return {
    url: u, quality: quality || 'HD',
    container: /\.m3u8(\?|$)/i.test(u) ? 'hls' : 'mp4',
    headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' },
    kind: 'dub', audioLang: 'es', subtitles: []
  };
}

function _abs(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  return SITE + (url.charAt(0) === '/' ? '' : '/') + url;
}

// htmlText no trae la tabla de entidades con acento, así que se completa aquí.
var _entities = {
  'aacute': 'á', 'eacute': 'é', 'iacute': 'í', 'oacute': 'ó', 'uacute': 'ú',
  'Aacute': 'Á', 'Eacute': 'É', 'Iacute': 'Í', 'Oacute': 'Ó', 'Uacute': 'Ú',
  'ntilde': 'ñ', 'Ntilde': 'Ñ', 'uuml': 'ü', 'Uuml': 'Ü', 'ccedil': 'ç',
  'iexcl': '¡', 'iquest': '¿', 'laquo': '«', 'raquo': '»', 'middot': '·',
  'ndash': '–', 'mdash': '—', 'hellip': '…', 'ordf': 'ª', 'ordm': 'º'
};

function _ent(s) {
  var t = htmlText(String(s || ''));
  return t.replace(/&([a-zA-Z]+);/g, function (all, name) {
    return _entities[name] || all;
  }).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}

// ── listados ─────────────────────────────────────────────────────────────────
// Cada ficha: enlace, año, portada perezosa (data-src) y título en el <h2>.
function _cards(html, type) {
  var out = [], seen = {};
  var chunks = String(html || '').split(/class="[^"]*TPostMv/i);
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i].split(/<\/li>/i)[0];
    var href = (c.match(/href="([^"]+)"/i) || [])[1] || '';
    var url = _abs(href);
    if (!url || seen[url]) continue;
    if (!/\/(?:pelicula|serie)s?\//i.test(url)) continue;
    var title = _ent((c.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1] || '');
    if (!title) title = _ent((c.match(/alt="([^"]*)"/i) || [])[1] || '');
    if (!title) continue;
    var cover = (c.match(/data-src="([^"]+)"/i) || [])[1] || (c.match(/src="([^"]+\.(?:jpg|png|webp)[^"]*)"/i) || [])[1] || '';
    var year = (c.match(/class="?Year"?[^>]*>\s*(\d{4})/i) || [])[1] || (url.match(/-(19|20)(\d{2})-[A-Z]\d+/i) ? ((url.match(/-(19|20)(\d{2})-[A-Z]\d+/) || [])[0].slice(1, 5)) : null);
    var kind = /\/serie\//i.test(url) ? 'tv' : (type || 'movie');
    seen[url] = 1;
    out.push({
      id: url, url: url, title: title, cover: cover || null,
      type: kind, year: year || null, sourceId: __SOURCE_ID
    });
  }
  return out;
}

function _list(path, type) {
  return _get(SITE + path, SITE + '/').then(function (html) { return _cards(html, type); });
}

function getHome() {
  return Promise.all([
    _list('/peliculas-populares/', 'movie').then(function (i) { return { title: 'Películas populares', items: i }; }),
    _list('/nuevas-peliculas/', 'movie').then(function (i) { return { title: 'Nuevas películas', items: i }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  var p = page > 1 ? '?page=' + page : '';
  return _list('/peliculas-populares/' + p, 'movie').catch(function () { return []; });
}

function latest(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  var p = page > 1 ? '?page=' + page : '';
  return _list('/nuevas-peliculas/' + p, 'movie').catch(function () { return []; });
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

// El buscador devuelve películas y series en la misma lista, separadas por
// pestañas; el HTML ya trae ambas, así que basta con leer las fichas.
function search(query, page) {
  var q = String(query || '').replace(/^\s+|\s+$/g, '');
  if (!q) return Promise.resolve([]);
  var p = page > 1 ? '&page=' + page : '';
  return _get(SITE + '/?s=' + encodeURIComponent(q) + p, SITE + '/').then(function (html) {
    return _zAlias(_cards(html, ''), q);
  }).catch(function () { return []; });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _meta(html, prop) {
  var m = html.match(new RegExp('(?:property|name)="' + prop + '"[^>]*content="([^"]*)"', 'i'))
    || html.match(new RegExp('content="([^"]*)"[^>]*(?:property|name)="' + prop + '"', 'i'));
  return m ? _ent(m[1]) : '';
}

function _title(html) {
  var t = _ent((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  if (t) return t;
  t = _meta(html, 'og:title');
  t = t.replace(/^Ver\s+/i, '').replace(/\s+Online.*$/i, '').replace(/\s*[-–|]\s*PelisPlus.*$/i, '');
  return t.replace(/\s*\(\d{4}\)\s*$/, '');
}

function _year(html, url) {
  var y = (url.match(/-(19|20)(\d{2})-[A-Z]\d+/i) || [])[0];
  if (y) return y.slice(1, 5);
  y = (html.match(/class="?Year"?[^>]*>\s*(\d{4})/i) || [])[1];
  if (y) return y;
  y = (_meta(html, 'og:title').match(/\((\d{4})\)/) || [])[1];
  return y || null;
}

function _seasons(html) {
  var out = [], seen = {}, re = /<option value="([^"]*\/serie\/\d+-(\d+)\/[^"]*)"/gi, m;
  while ((m = re.exec(html)) !== null) {
    var n = parseInt(m[2], 10);
    if (seen[n]) continue;
    seen[n] = 1;
    out.push({ n: n, url: _abs(m[1]) });
  }
  return out;
}

function _episodes(seasonUrl, id, slug, season) {
  return _get(seasonUrl, SITE + '/').then(function (html) {
    var out = [], seen = {}, re = new RegExp('href="(\\/serie\\/' + id + '-' + season + '-(\\d+)\\/[^"]*)"', 'gi'), m;
    while ((m = re.exec(html)) !== null) {
      var url = _abs(m[1]);
      if (seen[url]) continue;
      seen[url] = 1;
      var n = parseInt(m[2], 10);
      out.push({
        id: url, url: url,
        title: 'T' + season + ' · Cap ' + n,
        number: n, season: season, sourceId: __SOURCE_ID
      });
    }
    out.sort(function (a, b) { return a.number - b.number; });
    return out;
  });
}

function _detail(url) {
  var self = String(url || '').replace(/\/+$/, '') + '/';
  return _get(self, SITE + '/').then(function (html) {
    if (!html) throw new Error('PelisPlus: sin respuesta');
    var isSerie = /\/serie\//i.test(self);
    var title = _title(html);
    var cover = _meta(html, 'og:image') || null;
    var desc = _meta(html, 'og:description');
    var year = _year(html, self);

    if (!isSerie) {
      var ep = [{ id: self + 'play/', url: self + 'play/', title: 'Ver película', number: 1, sourceId: __SOURCE_ID }];
      return {
        id: self, title: title, url: self, cover: cover,
        description: desc, genres: [], studios: [],
        status: 'completed', year: year,
        type: 'movie', sourceId: __SOURCE_ID,
        episodes: ep, subCount: 0, dubCount: 1
      };
    }

    var id = (self.match(/\/serie\/(\d+)/) || [])[1] || '';
    var slug = self.slice(self.lastIndexOf('/serie/')).split('/')[2] || '';
    var seasons = _seasons(html);
    if (!id) throw new Error('PelisPlus: serie sin identificador');

    var jobs = [];
    for (var i = 0; i < seasons.length; i++) jobs.push(_episodes(seasons[i].url, id, slug, seasons[i].n));
    return Promise.all(jobs).then(function (lists) {
      var eps = [], seen = {};
      for (var l = 0; l < lists.length; l++) {
        var arr = lists[l] || [];
        for (var k = 0; k < arr.length; k++) {
          if (!arr[k].url || seen[arr[k].url]) continue;
          seen[arr[k].url] = 1;
          eps.push(arr[k]);
        }
      }
      return {
        id: self, title: title, url: self, cover: cover,
        description: desc, genres: [], studios: [],
        status: 'completed', year: year,
        type: 'tv', sourceId: __SOURCE_ID,
        episodes: eps, subCount: 0, dubCount: eps.length
      };
    });
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
// /play/ monta el reproductor con videojs y le pasa el mp4 firmado del CDN.
function getVideoSources(url) {
  var base = String(url || '').replace(/\/+$/, '');
  var play = /\/play$/i.test(base) ? base + '/' : base + '/play/';
  return _get(play, base + '/').then(function (html) {
    if (!html) throw new Error('PelisPlus: sin respuesta');
    var out = [], seen = {}, m;
    var re = /player\.src\(\s*\{\s*src\s*:\s*['"]([^'"]+)['"]/gi;
    while ((m = re.exec(html)) !== null) {
      var u = _abs(m[1]);
      if (!u || seen[u]) continue;
      seen[u] = 1;
      out.push(_stream(u, 'HD', play));
    }
    if (!out.length) {
      var f = html.match(/(?:sources|file)\s*:\s*\[?\s*\{?\s*(?:file|src)\s*:\s*['"]([^'"]+\.(?:mp4|m3u8)[^'"]*)['"]/i);
      if (f) out.push(_stream(_abs(f[1]), 'HD', play));
    }
    if (!out.length) throw new Error('PelisPlus: sin reproductor en esta página');
    // Los episodios de serie traen un mp4 de relleno alojado en GitHub: si el
    // único "stream" es ese, no hay fuente y se avisa en vez de entregar basura.
    var real = [];
    for (var k = 0; k < out.length; k++) if (!/raw\.githubusercontent\.com/i.test(out[k].url)) real.push(out[k]);
    if (!real.length) throw new Error('PelisPlus: episodio sin fuente (solo relleno)');
    return real;
  });
}

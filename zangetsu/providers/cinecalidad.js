// CineCalidad — fuente Zangetsu (películas y series, audio latino).
// WordPress + Dooplay: los mirrors Vimeos se abren con unpacker propio y dan m3u8 firmado.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://www.cinecalidad.am';
var VERSION = '1.2.1';

function getInfo() {
  return {
    name: 'CineCalidad', lang: 'es', baseUrl: SITE,
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
    kind: kind || 'sub', audioLang: 'es', subtitles: []
  };
}

// ── Dean Edwards packer (base-N real, no el de 36 fijo) ──────────────────────
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

function _findStream(code) {
  var m = code.match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
  if (!m) m = code.match(/https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/i);
  return m ? String(m[1] || m[0]).replace(/\\\//g, '/') : '';
}

// ── resolvers ────────────────────────────────────────────────────────────────
function _vimeos(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var code = _unpack(html);
    var s = _findStream(code);
    return s ? [_stream(s, 'HD', embed, kind)] : [];
  });
}

function _voe(embed, ref, kind) {
  function step(url, hops) {
    return _get(url, ref).then(function (html) {
      if (!html) return [];
      var s = _findStream(_unpack(html));
      if (s) return [_stream(s, 'auto', url, kind)];
      var next = (html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/) || [])[1];
      if (next && hops > 0) return step(next, hops - 1);
      return [];
    });
  }
  return step(embed, 2);
}

function _wish(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    if (!html) return [];
    var s = _findStream(_unpack(html));
    if (s) return [_stream(s, 'auto', embed, kind)];
    var js = (html.match(/src="([^"]*main\.js[^"]*)"/) || [])[1];
    if (!js) return [];
    var abs = js.indexOf('//') === 0 ? 'https:' + js : (js.charAt(0) === '/' ? (embed.match(/^https?:\/\/[^/]+/) || [])[0] + js : js);
    return _get(abs, embed).then(function (bundle) {
      var s2 = _findStream(_unpack(bundle));
      return s2 ? [_stream(s2, 'auto', embed, kind)] : [];
    });
  });
}

// streamwish / vidara / filelions family: the page runs a client-side
// jwplayer fed by POST /api/stream {filecode}. One hop, plain JSON, no
// packer — and it works where the Cloudflare-facing hosts do not.
function _api(embed, ref, kind) {
  var u = String(embed).replace(/\\\//g, '/');
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

function _dood(embed, ref, kind) {
  var url = String(embed).replace('/d/', '/e/');
  return fetch(url, { headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' }, browser: true })
    .then(function (r) {
      var body = r.body || '';
      var m = body.match(/\/pass_md5\/[^'"]+/);
      if (!m) return [];
      var base = (String(r.url || url).match(/^(https?:\/\/[^/]+)/) || [])[1] || '';
      var token = m[0].slice(m[0].lastIndexOf('/') + 1);
      return fetch(base + m[0], { headers: { 'User-Agent': UA, 'Referer': String(r.url || url) }, browser: true })
        .then(function (p) {
          var pre = String(p.body || '').replace(/\s+$/, '');
          if (!pre) return [];
          var rand = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          var tail = '';
          for (var i = 0; i < 10; i++) tail += rand.charAt(Math.floor(Math.random() * rand.length));
          return [_stream(pre + tail + '?token=' + token + '&expiry=' + Date.now(), 'auto', base + '/', kind)];
        });
    }).catch(function () { return []; });
}

function _yourupload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/<source[^>]*src="([^"]+\.mp4[^"]*)"/i)
      || html.match(/https?:\/\/[^"'\\\s]*vidcache[^"'\\\s]*\/video\.mp4[^"'\\\s]*/i)
      || html.match(/https?:\/\/[^"'\\\s]+\.mp4(?:[?"'\s]|$)/i);
    return m ? [_stream(String(m[1] || m[0]).replace(/["'\s]+$/, ''), 'auto', embed, kind)] : [];
  });
}

function _mp4upload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/player\.src\(\s*\{[^}]*?src\s*:\s*["']([^"']+)["']/i)
      || html.match(/player\.src\(\s*["']([^"']+)["']/i)
      || html.match(/https?:\/\/[a-z0-9.-]*mp4upload\.com[^"'\\\s]*\/video\.mp4/i);
    return m ? [_stream(String(m[1] || m[0]), 'auto', embed, kind)] : [];
  });
}

function _streamtape(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/id=([^&"']+)&token=([^&"']+)&expires=([^&"']+)&ip=([^"'&]+)/);
    if (!m) return [];
    var link = 'https://streamtape.com/get_video?id=' + m[1] + '&token=' + m[2] + '&expires=' + m[3] + '&ip=' + m[4];
    return _get(link, embed).then(function (body) {
      var u = String(body).trim().split(/\s+/)[0] || '';
      if (!u) return [];
      var base = (embed.match(/^(https?:\/\/[^/]+)/) || [])[1] || 'https://streamtape.com';
      if (u.indexOf('//') === 0) u = 'https:' + u;
      else if (u.charAt(0) === '/') u = base + u;
      return /\.mp4/i.test(u) ? [_stream(u, 'auto', embed, kind)] : [];
    });
  });
}

function _okru(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/data-options="([^"]+)"/);
    if (!m) return [];
    var raw = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\\&quot;/g, '"');
    var cfg = null;
    try { cfg = JSON.parse(raw); } catch (e) { return []; }
    var videos = (cfg && cfg.flashvars && cfg.flashvars.metadata && cfg.flashvars.metadata.videos) || [];
    var out = [];
    for (var i = 0; i < videos.length && out.length < 3; i++) {
      if (videos[i] && videos[i].url) out.push(_stream(videos[i].url, (videos[i].name || '').indexOf('hd') >= 0 ? 'HD' : 'SD', embed, kind));
    }
    return out;
  });
}

// Playback budget: Z Mode gives a source 20s (25s if pinned) to answer, and
// Promise.all waits for the SLOWEST mirror. So order by how fast a host
// actually resolves and never start the ones that always die: one dead
// Cloudflare embed would eat the whole budget and the title looks stalled.
function _rankEmbed(u) {
  var s = String(u).toLowerCase();
  if (s.indexOf('vimeos') >= 0) return 0;
  if (s.indexOf('vidara') >= 0) return 1;
  if (/streamwish|vidhide|awish|filelions|hgcloud|callistanise/.test(s)) return 3;
  if (s.indexOf('mp4upload') >= 0) return 2;
  if (s.indexOf('yourupload') >= 0) return 2;
  if (s.indexOf('streamtape') >= 0) return 4;
  if (/ok\.ru|okru/.test(s)) return 5;
  if (/voe\./.test(s)) return 6;
  if (/dood|dsvplay|ds2play|playmogo|savefiles/.test(s)) return 9; // Cloudflare: never resolves in the budget
  return 7;
}

function _pickEmbeds(list, cap) {
  var ranked = list.slice().sort(function (a, b) { return _rankEmbed(a) - _rankEmbed(b); });
  var out = [];
  for (var i = 0; i < ranked.length && out.length < cap; i++) {
    if (_rankEmbed(ranked[i]) >= 9) continue;
    out.push(ranked[i]);
  }
  return out;
}

function _resolve(embed, ref, kind) {
  var low = String(embed).toLowerCase();
  try {
    if (low.indexOf('vimeos') >= 0) return _vimeos(embed, ref, kind);
    if (low.indexOf('voe.') >= 0) return _voe(embed, ref, kind);
    if (/streamwish|hgcloud|awish|vidhide|savefiles|vidara|filelions|callistanise|acek-cdn/.test(low)) {
      return _api(embed, ref, kind).then(function (out) {
        return out.length ? out : _wish(embed, ref, kind);
      });
    }
    if (/dood|dsvplay|ds2play|playmogo/.test(low)) return _dood(embed, ref, kind);
    if (low.indexOf('yourupload') >= 0) return _yourupload(embed, ref, kind);
    if (low.indexOf('mp4upload') >= 0) return _mp4upload(embed, ref, kind);
    if (low.indexOf('streamtape') >= 0) return _streamtape(embed, ref, kind);
    if (low.indexOf('ok.ru') >= 0 || low.indexOf('okru') >= 0) return _okru(embed, ref, kind);
  } catch (e) { console.log('resolver: ' + e); }
  return Promise.resolve([]);
}

// ── catálogo ─────────────────────────────────────────────────────────────────
function _cards(html) {
  var out = [], seen = {};
  var chunks = String(html || '').split(/<article\b[^>]*>/i);
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i].split(/<\/article>/i)[0];
    var img = c.match(/<img\b[^>]*>/i);
    var href = (c.match(/<a[^>]*href="([^"]+)"/i) || [])[1] || '';
    if (!href || href.charAt(0) === '#') continue;
    if (img && /alt="promo"/i.test(img[0])) continue;
    var title = htmlText((c.match(/class="in_title"[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || '');
    if (!title && img) title = htmlText((img[0].match(/alt="([^"]*)"/i) || [])[1] || '');
    if (!title) continue;
    var cover = img ? ((img[0].match(/data-src="([^"]+)"/i) || img[0].match(/src="(https?[^"]+)"/i) || [])[1] || '') : '';
    var url = absUrl(href, SITE);
    if (!url || seen[url]) continue;
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
    _list('/').then(function (items) { return { title: 'Estrenos', items: items }; }),
    _list('/page/2/').then(function (items) { return { title: 'Recién agregadas', items: items }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  var path = page > 1 ? '/page/' + page + '/' : '/';
  return _list(path).catch(function () { return []; });
}

// ── emparejado de títulos ────────────────────────────────────────────────────
// Z Mode pide con el título de TMDB ("The Simpsons") y el sitio indexa el
// español ("Los Simpson"). Compara títulos normalizados y rechaza la fuente
// ante cualquier diferencia, así que un acierto perfecto se lee como fallo.
// MediaItem tiene `englishTitle` justo para esto: marcarlo con la consulta en
// el resultado que comparte una palabra identificativa hace que el matcher lo
// acepte. Sin palabra en común no se marca nada — un falso positivo
// reproduciría la película equivocada.
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
        // Prefijo en cualquiera de las dos direcciones: "Simpson" ~ "Simpsons".
        if (best < 1 && (w.indexOf(qt[a]) === 0 || qt[a].indexOf(w) === 0)) best = 1;
      }
      if (best) covered++;
      score += best;
    }
    // Una sola palabra en común no basta: "Project Hail Mary" encontraría
    // "Proud Mary" y el matcher reproduciría la película equivocada. Con hasta
    // tres palabras se exige que estén TODAS; con más, el 75%.
    var need = qt.length <= 3 ? qt.length : Math.ceil(qt.length * 0.75);
    if (covered < need) continue;
    items[i].englishTitle = query;
    scored.push({ it: items[i], score: score, words: tt.length, at: i });
  }
  if (!scored.length) return items;
  // El matcher se queda con el PRIMER resultado que acepta, así que el que de
  // verdad es la obra tiene que ir delante: más palabras de la consulta
  // cubiertas, y a igualdad el título más corto ("Los Simpson" antes que
  // "Les Simpson Classics – La dernière tentation d'Homer").
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

// Una búsqueda sin resultados no viene vacía: el tema pinta igual sus tarjetas
// de barra lateral. `in_title` sólo aparece en coincidencias reales.
function _searchOnce(q, page) {
  var p = page > 1 ? '&paged=' + page : '';
  return _get(SITE + '/?s=' + encodeURIComponent(q) + p, SITE + '/').then(function (html) {
    if (!/in_title/i.test(html)) return [];
    return _cards(html);
  }).catch(function () { return []; });
}

// El buscador de WordPress es por palabra completa y no recorta plurales:
// "The Simpsons" no encuentra nada, "Simpsons" tampoco, "Simpson" sí. Se
// prueba sin artículo y con la palabra recortada, y sólo tras un fallo real.
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

function search(query, page) {
  return _searchOnce(query, page).then(function (items) {
    if (items.length) return _zAlias(items, query);
    var alts = _searchFallbacks(query);
    if (!alts.length) return items;
    var chain = Promise.resolve([]);
    for (var i = 0; i < alts.length; i++) {
      chain = chain.then((function (q) {
        return function (prev) { return prev.length ? prev : _searchOnce(q, page); };
      })(alts[i]));
    }
    return chain.then(function (found) { return _zAlias(found, query); });
  });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _genres(html) {
  var out = [], seen = {}, m, re = /<a[^>]*href="[^"]*\/genero\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = re.exec(html)) !== null) {
    var g = htmlText(m[1]);
    if (g && !seen[g]) { seen[g] = 1; out.push(g); }
  }
  return out;
}

function _episodes(html) {
  var out = [], m;
  var re = /<div class="numerando">([\s\S]*?)<\/div>[\s\S]{0,400}?<div class="episodiotitle">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = re.exec(html)) !== null) {
    var num = htmlText(m[1]);
    var url = absUrl(m[2], SITE);
    var name = htmlText(m[3]) || num;
    if (!url) continue;
    var label = num ? (num + ' · ' + name) : name;
    out.push({ id: url, title: label, number: null, url: url });
  }
  return out;
}

function _detail(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('CineCalidad: sin respuesta');
    var title = '';
    var hs = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    for (var i = 0; i < hs.length; i++) {
      var t = htmlText(hs[i]);
      if (t && t.toLowerCase() !== 'cinecalidad') { title = t; break; }
    }
    if (!title) title = htmlText((html.match(/og:title" content="([^"]+)"/) || [])[1] || '');
    title = title.replace(/^\s*ver\s+/i, '').replace(/\s*[-|]\s*cinecalidad.*$/i, '');

    var img = html.match(/<img\b[^>]*class="[^"]*alignnone[^"]*"[^>]*>/i);
    var cover = img ? ((img[0].match(/data-src="([^"]+)"/i) || img[0].match(/src="(https?[^"]+)"/i) || [])[1] || '') : '';
    if (!cover) cover = (html.match(/og:image" content="([^"]+)"/) || [])[1] || null;

    var desc = (html.match(/itemprop="description"[^>]*>([\s\S]*?)<\//i) || [])[1]
      || (html.match(/<div[^>]*class="[^"]*wp-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || [])[1]
      || (html.match(/meta name="description" content="([^"]*)"/i) || [])[1] || '';
    desc = htmlText(desc);
    if (/^ver (pelicula|serie)\b/i.test(desc) && /cinecalidad/i.test(desc)) {
      var alt = (html.match(/<p[^>]*class="[^"]*(?:sinopsis|argumento)[^"]*"[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
      desc = alt ? htmlText(alt) : '';
    }

    var eps = _episodes(html);
    if (!eps.length) eps = [{ id: url, title: 'Ver película', number: 1, url: url }];

    var year = ((title.match(/(19|20)\d{2}/) || [])[0]) || (html.match(/(19|20)\d{2}/) || [])[0] || null;

    return {
      id: url, title: title, url: url, cover: cover,
      description: htmlText(desc), genres: _genres(html), studios: [],
      status: eps.length > 1 ? 'ongoing' : 'completed', year: year,
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
    var opts = [], m;
    var re = /<li[^>]*dooplay_player_option[^>]*>/gi;
    while ((m = re.exec(html)) !== null) {
      var tag = m[0];
      if (/trailer/i.test(tag)) continue;
      var embed = (tag.match(/data-option="([^"]+)"/i) || [])[1];
      if (!embed || /youtu/i.test(embed)) continue;
      opts.push(embed);
    }
    if (!opts.length) throw new Error('CineCalidad: sin reproductores');

    var chosen = _pickEmbeds(opts, 3);
    if (!chosen.length) chosen = opts.slice(0, 2);
    var jobs = [];
    for (var i = 0; i < chosen.length; i++) jobs.push(_resolve(chosen[i], url, 'dub'));
    return Promise.all(jobs).then(function (lists) {
      var out = [], seen = {};
      for (var l = 0; l < lists.length; l++) {
        var arr = lists[l] || [];
        for (var k = 0; k < arr.length; k++) {
          var s = arr[k];
          if (!s || !s.url || seen[s.url]) continue;
          seen[s.url] = 1;
          s.label = 'CineCalidad · ' + (s.container === 'hls' ? 'HLS' : 'MP4');
          out.push(s);
        }
      }
      if (!out.length) throw new Error('CineCalidad: mirror sin stream');
      return out;
    });
  });
}

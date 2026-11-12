// MonosChinos — fuente Zangetsu (anime sub español).
// Listado en <article><a class="card-wrap">; ficha con section.caplist[data-ajax]
// que devuelve { eps:[{num}] } -> /ver/<slug>-episodio-<n>.
// Players en base64 dentro de .srv[data-player]. Voe/Filemoon están tras captcha
// o SPA; streamwish/savefiles y mp4upload resuelven con el bloque local.

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
var SITE = 'https://monoschinos.st';
var VERSION = '1.0.0';

function getInfo() {
  return {
    name: 'MonosChinos', lang: 'es', baseUrl: SITE,
    logo: SITE + '/favicon.ico', type: 'anime', version: VERSION
  };
}

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
    kind: kind || 'sub', audioLang: 'ja', subtitles: []
  };
}

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

function _b64(str) {
  var s = String(str || '').replace(/[^A-Za-z0-9+/=]/g, '');
  var out = '', i = 0;
  var AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  while (i < s.length) {
    var c1 = AL.indexOf(s.charAt(i++)), c2 = AL.indexOf(s.charAt(i++));
    var c3 = AL.indexOf(s.charAt(i++)), c4 = AL.indexOf(s.charAt(i++));
    if (c1 < 0 || c2 < 0) break;
    out += String.fromCharCode((c1 << 2) | (c2 >> 4));
    if (c3 >= 0) out += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
    if (c4 >= 0) out += String.fromCharCode(((c3 & 3) << 6) | c4);
  }
  return out;
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

function _mp4upload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/player\.src\(\s*\{[^}]*?src\s*:\s*["']([^"']+)["']/i)
      || html.match(/player\.src\(\s*["']([^"']+)["']/i)
      || html.match(/https?:\/\/[a-z0-9.-]*mp4upload\.com[^"'\\\s]*\/video\.mp4/i);
    return m ? [_stream(String(m[1] || m[0]), 'auto', embed, kind)] : [];
  });
}

function _yourupload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/<source[^>]*src="([^"]+\.mp4[^"]*)"/i)
      || html.match(/https?:\/\/[^"'\\\s]*vidcache[^"'\\\s]*\/video\.mp4[^"'\\\s]*/i)
      || html.match(/https?:\/\/[^"'\\\s]+\.mp4(?:[?"'\s]|$)/i);
    return m ? [_stream(String(m[1] || m[0]).replace(/["'\s]+$/, ''), 'auto', embed, kind)] : [];
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

function _dood(embed, ref, kind) {
  var url = String(embed).replace('/d/', '/e/');
  return fetch(url, { headers: { 'User-Agent': UA, 'Referer': ref || SITE + '/' }, browser: true })
    .then(function (r) {
      var m = (r.body || '').match(/\/pass_md5\/[^'"]+/);
      if (!m) return [];
      var base = (String(r.url || url).match(/^(https?:\/\/[^/]+)/) || [])[1] || '';
      var token = m[0].slice(m[0].lastIndexOf('/') + 1);
      return fetch(base + m[0], { headers: { 'User-Agent': UA, 'Referer': String(r.url || url) }, browser: true })
        .then(function (p) {
          var pre = String(p.body || '').replace(/\s+$/, '');
          if (!pre) return [];
          var rand = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', tail = '';
          for (var i = 0; i < 10; i++) tail += rand.charAt(Math.floor(Math.random() * rand.length));
          return [_stream(pre + tail + '?token=' + token + '&expiry=' + Date.now(), 'auto', base + '/', kind)];
        });
    }).catch(function () { return []; });
}

function _resolve(embed, ref, kind) {
  var low = String(embed).toLowerCase();
  if (/mega\.nz|mediafire|1fichier|mega\.co/.test(low)) return Promise.resolve([]);
  try {
    if (/streamwish|hgcloud|awish|vidhide|savefiles|vidara|filelions|callistanise|acek-cdn/.test(low)) return _wish(embed, ref, kind);
    if (/voe\./.test(low)) return _voe(embed, ref, kind);
    if (/mp4upload/.test(low)) return _mp4upload(embed, ref, kind);
    if (/yourupload/.test(low)) return _yourupload(embed, ref, kind);
    if (/streamtape/.test(low)) return _streamtape(embed, ref, kind);
    if (/dood|dsvplay|ds2play|playmogo/.test(low)) return _dood(embed, ref, kind);
  } catch (e) { console.log('resolver: ' + e); }
  return Promise.resolve([]);
}

// ── catálogo ─────────────────────────────────────────────────────────────────
function _cards(html) {
  var out = [], seen = {};
  var chunks = String(html || '').split(/<article\b[^>]*>/i);
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i].split(/<\/article>/i)[0];
    var href = (c.match(/<a[^>]*class="[^"]*card-wrap[^"]*"[^>]*href="([^"]+)"/i)
      || c.match(/<a[^>]*href="([^"]+)"/i) || [])[1] || '';
    if (!href || href.indexOf('/anime/') < 0) continue;
    var title = htmlText((c.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || '');
    if (!title) title = htmlText((c.match(/alt="([^"]*)"/i) || [])[1] || '');
    if (!title) continue;
    var cover = (c.match(/<img[^>]*data-src="([^"]+)"/i) || c.match(/<img[^>]*src="([^"]+)"/i) || [])[1] || '';
    var url = absUrl(href, SITE);
    if (seen[url]) continue;
    seen[url] = 1;
    out.push({ id: url, title: title, cover: cover || null, url: url, type: 'anime', sourceId: __SOURCE_ID });
  }
  return out;
}

function _list(path) {
  return _get(SITE + path, SITE + '/').then(_cards);
}

function getHome() {
  return Promise.all([
    _list('/').then(function (items) { return { title: 'Últimos episodios', items: items.slice(0, 24) }; }),
    _list('/animes?p=1').then(function (items) { return { title: 'Animes', items: items.slice(0, 24) }; })
  ]).catch(function () { return []; });
}

function popular(opts) {
  var page = (opts && opts.page) ? opts.page : 1;
  return _list('/animes?p=' + page).catch(function () { return []; });
}

function search(query, page) {
  var p = page > 1 ? page : 1;
  return _list('/buscar?q=' + encodeURIComponent(query) + '&p=' + p).catch(function () { return []; });
}

// ── detalle ──────────────────────────────────────────────────────────────────
function _detail(url) {
  return _get(url, SITE + '/').then(function (html) {
    if (!html) throw new Error('MonosChinos: sin respuesta');
    var title = htmlText((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
    if (!title) throw new Error('MonosChinos: título no encontrado');

    var cover = (html.match(/<img[^>]*data-src="([^"]+)"/i) || [])[1]
      || (html.match(/og:image"\s+content="([^"]+)"/i) || [])[1] || null;
    var desc = htmlText((html.match(/meta name="description" content="([^"]*)"/i) || [])[1] || '');

    var genres = [], seenG = {}, g, reG = /<a[^>]*href="[^"]*\/genero\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((g = reG.exec(html)) !== null) {
      var name = htmlText(g[1]);
      if (name && !seenG[name]) { seenG[name] = 1; genres.push(name); }
    }

    var status = 'unknown';
    var lower = html.toLowerCase();
    if (lower.indexOf('en emisi') >= 0) status = 'ongoing';
    else if (lower.indexOf('finalizado') >= 0) status = 'completed';

    var slug = '';
    var mm = url.match(/\/anime\/([^\/?#]+)/);
    if (mm) slug = decodeURIComponent(mm[1]).replace(/-sub-espanol$/, '').replace(/-latino$/, '');

    var d = html.match(/var year = (\d{4});/);
    var year = (d ? d[1] : null) || ((html.match(/(19|20)\d{2}/) || [])[0]) || null;

    var ajax = (html.match(/<section[^>]*class="[^"]*caplist[^"]*"[^>]*data-ajax="([^"]+)"/i) || [])[1] || '';

    if (!ajax) {
      var eps = [{ id: url, title: title, number: 1, url: url }];
      return {
        id: url, title: title, url: url, cover: cover, description: desc,
        genres: genres, studios: [], status: status, year: year, type: 'anime',
        sourceId: __SOURCE_ID, episodes: eps, subCount: eps.length, dubCount: 0
      };
    }

    var ajaxUrl = ajax.indexOf('http') === 0 ? ajax : absUrl(ajax, url);
    return _get(ajaxUrl, url, {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*; q=0.01'
    }).then(function (body) {
      var nums = [], data = null;
      try { data = JSON.parse(body); } catch (e) { data = null; }
      if (data && data.eps) {
        for (var i = 0; i < data.eps.length; i++) {
          var n = data.eps[i].num;
          if (n) nums.push(parseInt(n, 10));
        }
      }
      var out = [];
      for (var k = 0; k < nums.length; k++) {
        var epUrl = SITE + '/ver/' + slug + '-episodio-' + nums[k];
        out.push({ id: epUrl, title: 'Episodio ' + nums[k], number: nums[k], url: epUrl });
      }
      out.reverse();
      if (!out.length) out = [{ id: url, title: title, number: 1, url: url }];
      return {
        id: url, title: title, url: url, cover: cover, description: desc,
        genres: genres, studios: [], status: status, year: year, type: 'anime',
        sourceId: __SOURCE_ID, episodes: out, subCount: out.length, dubCount: 0
      };
    });
  });
}

function getDetail(url) { return _detail(url); }
function getEpisodes(url) { return _detail(url).then(function (d) { return d.episodes; }); }

// ── streams ──────────────────────────────────────────────────────────────────
function getVideoSources(url) {
  return _get(url, SITE + '/').then(function (html) {
    var jobs = [], m, seen = {};
    var re = /<[^>]*class="[^"]*srv[^"]*"[^>]*data-player="([^"]+)"[^>]*>([\s\S]{0,80}?)<\//gi;
    while ((m = re.exec(html)) !== null) {
      var embed = _b64(m[1]);
      if (!/^https?:\/\//.test(embed)) continue;
      if (/mega\.nz|mediafire|1fichier/i.test(embed)) continue;
      if (seen[embed]) continue;
      seen[embed] = 1;
      var server = htmlText(m[2]) || 'Online';
      jobs.push((function (emb, srv) {
        return _resolve(emb, url, 'sub').then(function (list) {
          for (var k = 0; k < list.length; k++) list[k].label = 'MonosChinos · ' + srv;
          return list;
        });
      })(embed, server));
    }
    if (!jobs.length) throw new Error('MonosChinos: sin reproductores');

    return Promise.all(jobs).then(function (lists) {
      var out = [], seenUrl = {};
      for (var l = 0; l < lists.length; l++) {
        var arr = lists[l] || [];
        for (var k = 0; k < arr.length; k++) {
          var s = arr[k];
          if (!s || !s.url || seenUrl[s.url]) continue;
          seenUrl[s.url] = 1;
          out.push(s);
        }
      }
      if (!out.length) throw new Error('MonosChinos: mirror sin stream');
      return out;
    });
  });
}

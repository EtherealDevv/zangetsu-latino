const fs = require("fs");
const files = ["zangetsu/providers/jkanime.js", "zangetsu/providers/tioanime.js", "zangetsu/providers/monoschinos.js", "zangetsu/providers/cinecalidad.js"];
const oldMp4 = `function _mp4upload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/player\\.src\\(\\s*["']([^"']+)["']/i)
      || html.match(/https?:\\/\\/[^"'\\\\\\s]+\\.mp4[^"'\\\\\\s]*/i);
    return m ? [_stream(String(m[1] || m[0]), 'auto', embed, kind)] : [];
  });
}`;
const newMp4 = `function _mp4upload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/player\\.src\\(\\s*\\{[^}]*?src\\s*:\\s*["']([^"']+)["']/i)
      || html.match(/player\\.src\\(\\s*["']([^"']+)["']/i)
      || html.match(/https?:\\/\\/[a-z0-9.-]*mp4upload\\.com[^"'\\\\\\s]*\\/video\\.mp4/i);
    return m ? [_stream(String(m[1] || m[0]), 'auto', embed, kind)] : [];
  });
}`;
const oldYu = `function _yourupload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/https?:\\/\\/[^"'\\\\\\s]+\\.mp4[^"'\\\\\\s]*/i);
    return m ? [_stream(m[0], 'auto', embed, kind)] : [];
  });
}`;
const newYu = `function _yourupload(embed, ref, kind) {
  return _get(embed, ref).then(function (html) {
    var m = html.match(/<source[^>]*src="([^"]+\\.mp4[^"]*)"/i)
      || html.match(/https?:\\/\\/[^"'\\\\\\s]*vidcache[^"'\\\\\\s]*\\/video\\.mp4[^"'\\\\\\s]*/i)
      || html.match(/https?:\\/\\/[^"'\\\\\\s]+\\.mp4(?:[?"'\\s]|$)/i);
    return m ? [_stream(String(m[1] || m[0]).replace(/["'\\s]+$/, ''), 'auto', embed, kind)] : [];
  });
}`;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const a = s.includes(oldMp4), b = s.includes(oldYu);
  if (a) s = s.replace(oldMp4, newMp4);
  if (b) s = s.replace(oldYu, newYu);
  fs.writeFileSync(f, s);
  console.log(f, "mp4:", a, "yu:", b);
}

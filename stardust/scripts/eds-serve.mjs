// Local EDS render harness: serves the broadridge repo code + DA content
// exactly the way aem.live would — full HTML docs (head.html + main content,
// metadata block hoisted to <head> meta tags) plus .plain.html for fragments.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const REPO = 'broadridge';
const CONTENT = 'stardust/migrated/da';
const PORT = process.env.PORT || 8791;

const MIME = {
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.html': 'text/html', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const headHtml = await readFile(path.join(REPO, 'head.html'), 'utf8');

function extractMetadata(body) {
  // find <div class="metadata"> block; convert rows to meta tags; remove block
  const meta = {};
  const re = /<div class="metadata">([\s\S]*?)<\/div>\s*<\/div>\s*(<\/main>)?/;
  const blockRe = /<div class="metadata">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  const m = body.match(blockRe);
  if (!m) return { body, meta };
  const block = m[0];
  const rowRe = /<div>\s*<div>([\s\S]*?)<\/div>\s*<div>([\s\S]*?)<\/div>\s*<\/div>/g;
  let r;
  // eslint-disable-next-line no-cond-assign
  while ((r = rowRe.exec(block)) !== null) {
    const key = r[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
    let val = r[2].trim();
    const img = val.match(/src="([^"]+)"/);
    if (img) val = img[1];
    else val = val.replace(/<[^>]+>/g, '').trim();
    if (key) meta[key] = val;
  }
  return { body: body.replace(block, ''), meta };
}

function metaTags(meta, urlPath) {
  const title = meta.title || 'Broadridge';
  let tags = `<title>${title}</title>\n`;
  tags += `<link rel="canonical" href="https://www.broadridge.com${urlPath}">\n`;
  const map = { description: 'description', template: 'template', locale: 'locale', publishdate: 'publishdate', category: 'category' };
  Object.entries(map).forEach(([k, name]) => {
    if (meta[k]) tags += `<meta name="${name}" content="${meta[k].replace(/"/g, '&quot;')}">\n`;
  });
  tags += `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}">\n`;
  if (meta.description) tags += `<meta property="og:description" content="${meta.description.replace(/"/g, '&quot;')}">\n`;
  if (meta.image) tags += `<meta property="og:image" content="${meta.image}">\n`;
  return tags;
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // repo static assets
    for (const prefix of ['/scripts/', '/styles/', '/blocks/', '/icons/', '/fonts/']) {
      if (urlPath.startsWith(prefix)) {
        const f = path.join(REPO, urlPath);
        if (await exists(f)) {
          res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
          res.end(await readFile(f));
          return;
        }
      }
    }
    if (urlPath === '/favicon.ico') {
      res.writeHead(200, { 'content-type': 'image/x-icon' });
      res.end(await readFile(path.join(REPO, 'favicon.ico')));
      return;
    }
    if (urlPath === '/query-index.json') {
      const f = path.join(CONTENT, 'query-index.json');
      if (await exists(f)) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(await readFile(f));
        return;
      }
    }
    // plain.html (fragments, nav, footer)
    const plain = urlPath.endsWith('.plain.html');
    if (plain) urlPath = urlPath.replace(/\.plain\.html$/, '');
    let file = path.join(CONTENT, urlPath === '/' ? 'index.html' : `${urlPath.replace(/\/$/, '')}.html`);
    if (!await exists(file)) {
      file = path.join(CONTENT, urlPath.replace(/\/$/, ''), 'index.html');
    }
    if (!await exists(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404');
      return;
    }
    let doc = await readFile(file, 'utf8');
    const mainMatch = doc.match(/<main>([\s\S]*)<\/main>/);
    let mainContent = mainMatch ? mainMatch[1] : doc;
    const { body: cleaned, meta } = extractMetadata(mainContent);
    mainContent = cleaned.replace(/<div>\s*<\/div>/g, '');
    if (plain) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(mainContent);
      return;
    }
    const html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n${metaTags(meta, urlPath)}${headHtml}\n</head>\n<body>\n<header></header>\n<main>${mainContent}</main>\n<footer></footer>\n</body>\n</html>`;
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(html);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(e.stack || e));
  }
});

server.listen(PORT, () => console.log(`[eds-serve] http://localhost:${PORT}/`));

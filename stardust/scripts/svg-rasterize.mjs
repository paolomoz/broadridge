// Rasterize oversized SVGs (pipeline 40KB SVG limit) to 2x transparent PNGs.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const big = JSON.parse(readFileSync('/tmp/big-svgs.json', 'utf8'));
mkdirSync('stardust/migrated/media', { recursive: true });
const b = await chromium.launch();
const pg = await (await b.newContext({ deviceScaleFactor: 2 })).newPage();
const map = {};
for (const url of Object.keys(big)) {
  try {
    const base = path.basename(new URL(url).pathname, '.svg').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const hash = createHash('sha1').update(url).digest('hex').slice(0, 6);
    const name = `${base}-${hash}.png`;
    await pg.setContent(`<html><body style="margin:0;background:transparent"><img id="t" src="${url}"></body></html>`);
    await pg.waitForFunction(() => document.getElementById('t').complete && document.getElementById('t').naturalWidth > 0, { timeout: 30000 });
    const dims = await pg.evaluate(() => {
      const i = document.getElementById('t');
      const w = Math.min(i.naturalWidth || 1200, 1600);
      i.style.width = `${w}px`;
      return { w, h: i.getBoundingClientRect().height };
    });
    await pg.setViewportSize({ width: Math.ceil(dims.w), height: Math.ceil(dims.h) || 800 });
    const el = await pg.$('#t');
    const buf = await el.screenshot({ omitBackground: true });
    writeFileSync(`stardust/migrated/media/${name}`, buf);
    map[url] = `/media/${name}`;
    console.log(`ok ${name} (${Math.round(buf.length / 1024)}KB) <- ${Math.round(big[url] / 1024)}KB svg`);
  } catch (e) {
    console.log(`FAIL ${url.slice(0, 80)}: ${String(e).slice(0, 100)}`);
  }
}
writeFileSync('/tmp/svg-map.json', JSON.stringify(map, null, 1));
console.log(`rasterized ${Object.keys(map).length}/${Object.keys(big).length}`);
await b.close();

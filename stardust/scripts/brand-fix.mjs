// Targeted follow-up: typekit font files (content-type based intercept) + real header logo.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const OUT = 'stardust/current';
const browser = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'], ignoreDefaultArgs: ['--enable-automation'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });

const fonts = [];
ctx.on('response', async (resp) => {
  const ct = (resp.headers()['content-type'] || '').toLowerCase();
  const u = resp.url();
  if ((ct.includes('font') || /\.(woff2?|ttf|otf)(\?|$)/i.test(u)) && resp.ok()) {
    try { fonts.push({ url: u, ct, body: await resp.body() }); } catch { }
  }
});

const page = await ctx.newPage();
await page.goto('https://www.broadridge.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(4000);

const logo = await page.evaluate(() => {
  const cands = [];
  for (const el of document.querySelectorAll('header a img, header svg, header a[class*="logo" i], [class*="logo" i] img, [class*="logo" i] svg')) {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 10) continue;
    cands.push({ tag: el.tagName.toLowerCase(), w: r.width, h: r.height, src: el.currentSrc || el.src || null, outer: el.tagName === 'svg' ? el.outerHTML : null, sel: (el.className && typeof el.className === 'string' ? el.className : '') || el.parentElement.className });
  }
  return cands;
});
console.log(JSON.stringify(logo.map(({ outer, ...r }) => ({ ...r, svgLen: outer ? outer.length : 0 })), null, 1));

await mkdir(path.join(OUT, 'assets', 'fonts'), { recursive: true });
const saved = [];
for (const f of fonts) {
  const urlPath = new URL(f.url).pathname;
  let base = path.basename(urlPath) || 'font';
  const hash = createHash('sha256').update(f.body).digest('hex').slice(0, 8);
  const ext = f.ct.includes('woff2') || f.url.includes('woff2') ? '.woff2' : (path.extname(base) || '.woff');
  base = base.replace(/\.[a-z0-9]+$/i, '');
  const name = `${base}-${hash}${ext}`;
  await writeFile(path.join(OUT, 'assets', 'fonts', name), f.body);
  saved.push({ url: f.url, ct: f.ct, localPath: `stardust/current/assets/fonts/${name}`, bytes: f.body.length });
}
console.log(JSON.stringify(saved, null, 1));

// save best logo candidate
const best = logo.filter((l) => l.w >= 80).sort((a, b) => b.w * b.h - a.w * a.h)[0] || logo[0];
if (best) {
  if (best.outer) { await writeFile(path.join(OUT, 'assets', 'logo.svg'), best.outer); console.log('[logo] saved inline svg', best.w, 'x', best.h); }
  else if (best.src) {
    const r = await ctx.request.get(best.src);
    const ext = path.extname(new URL(best.src).pathname) || '.png';
    await writeFile(path.join(OUT, 'assets', `logo${ext}`), await r.body());
    console.log('[logo] saved', best.src, best.w, 'x', best.h);
  }
}
await browser.close();

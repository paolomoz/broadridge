import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(2000);
const r = await pg.evaluate(() => {
  const sel = ['.wyswyg p', 'main .default-content-wrapper p', 'main p'];
  for (const s of sel) {
    const p = [...document.querySelectorAll(s)].find((x) => x.textContent.length > 100);
    if (p) {
      const cs = getComputedStyle(p);
      const rect = p.getBoundingClientRect();
      return { sel: s, fs: cs.fontSize, lh: cs.lineHeight, mb: cs.marginBottom, w: Math.round(rect.width), color: cs.color };
    }
  }
  return null;
});
console.log(process.argv[2], JSON.stringify(r));
await b.close();

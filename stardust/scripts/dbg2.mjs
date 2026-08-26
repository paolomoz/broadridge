import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg.goto('http://localhost:8899/press-release/2022/annual-broadridge-distribution-achievement-awards', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1500);
const r = await pg.evaluate(() => {
  const rail = document.querySelector('.press-rail');
  const sheets = [...document.styleSheets].map((s) => {
    try { return { href: s.href, rules: s.cssRules.length }; } catch (e) { return { href: s.href, err: String(e).slice(0, 60) }; }
  });
  return {
    railClass: rail?.className,
    railStatus: rail?.dataset.blockStatus,
    railDisplay: rail ? getComputedStyle(rail).display : null,
    sheets,
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();

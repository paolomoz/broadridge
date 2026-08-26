import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg.goto('http://localhost:8899/press-release/2022/annual-broadridge-distribution-achievement-awards', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1500);
const r = await pg.evaluate(() => {
  const rail = document.querySelector('.press-rail');
  const lazy = [...document.styleSheets].find((s) => s.href && s.href.includes('lazy-styles'));
  const rules = [];
  [...lazy.cssRules].forEach((rule) => {
    if (rule.media) {
      rules.push({ media: rule.media.mediaText, matches: window.matchMedia(rule.media.mediaText).matches, inner: [...rule.cssRules].map((r2) => r2.selectorText) });
    } else rules.push(rule.selectorText);
  });
  return { railMatches: rail.matches('body.press-release main .press-rail'), rules };
});
console.log(JSON.stringify(r, null, 1));
await b.close();

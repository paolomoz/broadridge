import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg.goto('http://localhost:8899/press-release/2022/annual-broadridge-distribution-achievement-awards', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1500);
const r = await pg.evaluate(() => {
  const rail = document.querySelector('.press-rail');
  const chain = [];
  let el = rail;
  while (el && chain.length < 8) { chain.push(`${el.tagName}.${el.className.toString().slice(0, 40)}`); el = el.parentElement; }
  return chain;
});
console.log(JSON.stringify(r, null, 1));
await b.close();

import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext()).newPage();
const fontResponses = [];
pg.on('response', (r) => { if (r.url().includes('typekit')) fontResponses.push(`${r.status()} ${r.url().slice(0, 80)}`); });
await pg.goto(process.argv[2], { waitUntil: 'networkidle' });
await pg.waitForTimeout(1500);
const fonts = await pg.evaluate(() => {
  const h1 = document.querySelector('h2, h1');
  const p = document.querySelector('main p');
  return {
    h1Font: h1 ? getComputedStyle(h1).fontFamily.slice(0, 60) : null,
    loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`).slice(0, 8),
  };
});
console.log(JSON.stringify({ fontResponses: fontResponses.slice(0, 6), ...fonts }, null, 1));
await b.close();

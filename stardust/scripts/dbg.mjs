import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg.goto('http://localhost:8899/press-release/2022/annual-broadridge-distribution-achievement-awards', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1000);
const r = await pg.evaluate(() => ({
  bodyClass: document.body.className,
  sections: [...document.querySelectorAll('main > div')].map((d) => d.className.slice(0, 60)),
  railParent: document.querySelector('.press-rail')?.parentElement?.className.slice(0, 60),
  railPos: document.querySelector('.press-rail') ? getComputedStyle(document.querySelector('.press-rail')).position : null,
}));
console.log(JSON.stringify(r, null, 1));
await b.close();

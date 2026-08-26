import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg.goto('http://localhost:8899/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1200);
const r = await pg.evaluate(() => {
  const h2 = document.querySelector('.hero-carousel > div:first-child h2');
  const a = h2?.querySelector('a');
  const img = document.querySelector('.hero-carousel > div:first-child img');
  const btn = document.querySelector('.hero-carousel > div:first-child .button');
  const cs = (el) => el ? { color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor, z: getComputedStyle(el).zIndex, pos: getComputedStyle(el).position, op: getComputedStyle(el).opacity } : null;
  // what's on top at NAVIGATE's position?
  const rect = h2.getBoundingClientRect();
  const top = document.elementFromPoint(rect.left + 40, rect.top + 40);
  return { h2: cs(h2), a: cs(a), img: cs(img), btn: cs(btn), topEl: top ? `${top.tagName}.${top.className.toString().slice(0, 40)}` : null };
});
console.log(JSON.stringify(r, null, 1));
await b.close();

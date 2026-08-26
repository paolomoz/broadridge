import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext()).newPage();
await pg.goto('http://localhost:8899/press-hub', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1500);
const r = await pg.evaluate(async () => {
  const resp = await fetch('/query-index.json?limit=5000');
  const { data } = await resp.json();
  const press = data.filter((x) => /\/press-release\//.test(x.path));
  const block = document.querySelector('.listing');
  return { total: data.length, press: press.length, sample: press[0], blockClasses: block?.className, items: document.querySelectorAll('.listing-item').length };
});
console.log(JSON.stringify(r, null, 1));
await b.close();

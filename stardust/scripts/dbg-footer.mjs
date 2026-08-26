import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg.goto('http://localhost:8899/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1200);
const r = await pg.evaluate(() => {
  const fl = document.querySelector('footer .footer-links');
  const li = fl?.querySelector('li');
  const ul = fl?.querySelector('ul');
  return {
    flClass: fl?.className,
    structure: fl ? fl.innerHTML.slice(0, 300) : null,
    liDisplay: li ? getComputedStyle(li).display : null,
    ulDisplay: ul ? getComputedStyle(ul).display : null,
    rowDisplay: fl?.firstElementChild ? getComputedStyle(fl.firstElementChild).display : null,
    intro: document.querySelector('.section:has(.form) h2')?.nextElementSibling?.textContent.slice(0, 80),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();

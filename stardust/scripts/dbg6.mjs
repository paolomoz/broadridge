import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext()).newPage();
await pg.goto('http://localhost:8899/search-results?q=proxy', { waitUntil: 'networkidle' });
await pg.waitForTimeout(2000);
const search = await pg.evaluate(() => ({
  results: document.querySelectorAll('.search-results li').length,
  status: document.querySelector('.search [role="status"]')?.textContent,
}));
await pg.goto('http://localhost:8899/insight-pages/artificial-intelligence', { waitUntil: 'networkidle' });
await pg.waitForTimeout(2000);
const hub = await pg.evaluate(() => ({
  items: document.querySelectorAll('.listing-item').length,
  facets: document.querySelectorAll('.listing select option').length,
}));
console.log(JSON.stringify({ search, hub }, null, 1));
await b.close();

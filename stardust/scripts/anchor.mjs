// anchor.mjs <url> <width> — section boxes [y,h] for main sections + footer
import { chromium } from 'playwright';
import { newLiveContext, gotoLive, dismissOverlays, isLiveHttpUrl } from '../../scripts/diff/live-session.mjs';
const [url, w] = [process.argv[2], parseInt(process.argv[3] || '1440', 10)];
const b = await chromium.launch();
let pg;
if (isLiveHttpUrl(url)) {
  const ctx = await newLiveContext(b, { viewport: { width: w, height: 900 } });
  pg = await ctx.newPage();
  await gotoLive(pg, url, { settleMs: 2500 });
  await dismissOverlays(pg);
} else {
  pg = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await pg.goto(url, { waitUntil: 'networkidle' });
}
await pg.waitForTimeout(2500);
await pg.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400)); });
const out = await pg.evaluate(() => {
  const r = (e) => { const x = e.getBoundingClientRect(); return [Math.round(x.y + scrollY), Math.round(x.height)]; };
  const secs = [...document.querySelectorAll('main > section, main > .section')].map((s) => ({ c: String(s.className).replace(/section|container-extended|py-\S+|lg:\S+/g, ' ').trim().split(/\s+/).slice(0, 2).join('.'), r: r(s) }));
  const f = document.querySelector('footer');
  return JSON.stringify({ doc: document.documentElement.scrollHeight, secs, footer: f ? r(f) : null });
});
console.log(out);
await b.close();

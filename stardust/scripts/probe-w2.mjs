import { chromium } from 'playwright';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';
const b = await chromium.launch();
const url = 'https://www.broadridge.com/capability/wealth-advisor-solutions/';
for (const width of [1440, 360]) {
  const ctx = await newLiveContext(b, { viewport: { width, height: 900 } });
  const pg = await ctx.newPage();
  await gotoLive(pg, url, { settleMs: 2500 });
  await dismissOverlays(pg);
  await pg.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } });
  const out = await pg.evaluate(() => {
    const r = (e) => { const x = e.getBoundingClientRect(); return [Math.round(x.y + scrollY), Math.round(x.height), Math.round(x.x), Math.round(x.width)]; };
    const g = (e, ps) => { const c = getComputedStyle(e); const o = {}; ps.forEach((p) => { o[p] = c[p]; }); return o; };
    const res = { doc: document.documentElement.scrollHeight, secs: [...document.querySelectorAll('main > section')].map((s) => ({ c: String(s.className).slice(0, 40), r: r(s) })) };
    const cg = document.querySelector('section.card-grid');
    if (cg) {
      const wrap = cg.querySelector('[class*="__wrap"], .container-extended > div');
      const cards = [...cg.querySelectorAll('a.card, .card')];
      res.cardGrid = { wrap: wrap ? { r: r(wrap), ...g(wrap, ['backgroundColor', 'padding', 'gridTemplateColumns', 'gap', 'borderRadius']) } : null,
        heading: (() => { const h = cg.querySelector('h2'); return h ? { r: r(h), fs: g(h, ['fontSize', 'color']).fontSize, color: g(h, ['color']).color } : null; })(),
        cards: cards.slice(0, 4).map((c) => ({ r: r(c), bg: g(c, ['backgroundColor']).backgroundColor, cls: String(c.className).slice(0, 60) })),
        cardTitle: (() => { const t = cg.querySelector('.card h3, .card .title-1, .card .heading'); return t ? { r: r(t), ...g(t, ['fontSize', 'lineHeight', 'color']) } : null; })(),
        cardDesc: (() => { const t = cg.querySelector('.card p'); return t ? { r: r(t), ...g(t, ['fontSize', 'lineHeight', 'color']) } : null; })() };
    }
    const ac = document.querySelector('section.careers');
    if (ac) {
      res.altBlocks = { sec: r(ac),
        rows: [...ac.querySelectorAll('.careers__item, [class*="__item"], [class*="row"]')].slice(0, 4).map((x) => ({ r: r(x), cls: String(x.className).slice(0, 50) })),
        imgs: [...ac.querySelectorAll('img')].slice(0, 3).map((i) => ({ r: r(i), fit: g(i, ['objectFit']).objectFit })),
        h2: (() => { const h = ac.querySelector('h2'); return h ? { r: r(h), fs: g(h, ['fontSize']).fontSize } : null; })(),
        h3s: [...ac.querySelectorAll('h3')].slice(0, 3).map((h) => ({ r: r(h), fs: g(h, ['fontSize']).fontSize, t: h.textContent.trim().slice(0, 30) })) };
    }
    return JSON.stringify(res);
  });
  console.log(`W${width}:`, out.slice(0, 2600));
  await ctx.close();
}
await b.close();

import { chromium } from 'playwright';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';
const b = await chromium.launch();
const probe = async (url, sel, width) => {
  const ctx = await newLiveContext(b, { viewport: { width, height: 900 } });
  const pg = await ctx.newPage();
  await gotoLive(pg, url, { settleMs: 2500 });
  await dismissOverlays(pg);
  await pg.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } });
  const out = await pg.evaluate((s) => {
    const T = ['fontSize', 'fontWeight', 'lineHeight', 'color'];
    const B = ['backgroundColor', 'paddingTop', 'paddingLeft', 'display', 'gridTemplateColumns', 'gap', 'borderRadius'];
    const cs = (el, ps) => { const c = getComputedStyle(el); const o = {}; ps.forEach((p) => { o[p] = c[p]; }); return o; };
    const tree = (el, d) => { if (!el || d < 0) return null; const x = el.getBoundingClientRect(); const o = { t: el.tagName.toLowerCase(), c: String(el.className).slice(0, 60), x: [Math.round(x.y + scrollY), Math.round(x.height), Math.round(x.x), Math.round(x.width)], f: cs(el, T), b: cs(el, B), txt: el.children.length === 0 ? el.textContent.trim().slice(0, 50) : undefined }; if (d > 0) o.k = [...el.children].map((c2) => tree(c2, d - 1)).filter(Boolean); return o; };
    return JSON.stringify(tree(document.querySelector(s), 5));
  }, sel);
  console.log(`\n=== ${url.split('/').pop()} ${sel} @${width}`);
  console.log(out);
  await ctx.close();
};
await probe('https://www.broadridge.com/who-we-serve/issuers', 'section.b1-cta-banner', 1440);
await probe('https://www.broadridge.com/who-we-serve/capital-markets', 'section.bento-grid-six-cards', 1440);
await b.close();

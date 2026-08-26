/**
 * Phase 3(b) probe for /who-we-serve/asset-management (test-b-asset-management).
 * Measures the four modules NOT already gated on the home replica:
 * hero-general, c2-text-slider (x2), key-stats, bento-grid-four-plus-one.
 * Output: stardust/replica/test-b/measurements-am.json
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';

const URL_LIVE = 'https://www.broadridge.com/who-we-serve/asset-management';
const OUT = 'stardust/replica/test-b/measurements-am.json';
const browser = await chromium.launch();
const result = { url: URL_LIVE, widths: {} };

for (const width of [1440, 360]) {
  const ctx = await newLiveContext(browser, { viewport: { width, height: width > 800 ? 900 : 780 } });
  const page = await ctx.newPage();
  await gotoLive(page, URL_LIVE, { settleMs: 2500 });
  await dismissOverlays(page);
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 600));
  });

  const data = await page.evaluate(() => {
    const T = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'letterSpacing', 'textTransform'];
    const B = ['backgroundColor', 'backgroundImage', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'display', 'gridTemplateColumns', 'gap', 'flexDirection', 'alignItems', 'justifyContent', 'position', 'overflow', 'marginTop', 'marginBottom', 'maxWidth', 'opacity', 'objectFit', 'zIndex'];
    const cs = (el, props) => { if (!el) return null; const c = getComputedStyle(el); const o = {}; props.forEach((p) => { o[p] = c[p]; }); return o; };
    const dump = (el) => (el ? { tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 100), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70), rect: (() => { const r = el.getBoundingClientRect(); return [Math.round(r.y + scrollY), Math.round(r.height), Math.round(r.x), Math.round(r.width)]; })(), t: cs(el, T), b: cs(el, B) } : null);
    const tree = (el, d) => { if (!el || d < 0) return null; const o = dump(el); if (d > 0) o.kids = [...el.children].map((k) => tree(k, d - 1)).filter(Boolean); return o; };
    const q = (s, r = document) => r.querySelector(s);
    const qa = (s, r = document) => [...r.querySelectorAll(s)];
    const out = { doc: document.documentElement.scrollHeight };

    // all main sections: rect map
    out.sections = qa('main > section').map((s) => ({ cls: String(s.className).slice(0, 60), rect: dump(s).rect }));

    // hero-general
    out.hero = tree(q('section.hero-general'), 4);
    out.heroImgs = qa('section.hero-general img').map((i) => ({ src: i.currentSrc.split('/').pop().slice(0, 50), rect: dump(i).rect, b: cs(i, ['position', 'objectFit', 'opacity', 'zIndex']) }));
    // c2 text sliders (both)
    out.sliders = qa('section.c2-text-slider').map((s) => tree(s, 4));
    // key stats
    out.stats = tree(q('section.key-stats'), 5);
    // bento 4+1
    out.bento = tree(q('section.bento-grid-four-plus-one'), 5);
    return out;
  });
  result.widths[width] = data;
  await ctx.close();
  console.log(`measured ${width}: doc=${data.doc}`);
}
await browser.close();
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log('wrote', OUT);

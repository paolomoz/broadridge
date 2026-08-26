/**
 * Phase 3(b) drill-down probe #2: featured-solutions card internals,
 * analyst-recognition awards grid, contact-us form band, top-tabber panel,
 * insights chrome, footer structure. Merges into measurements.json as `drill`.
 */
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';

const URL_LIVE = 'https://www.broadridge.com/';
const OUT = 'stardust/replica/test-b/measurements.json';
const WIDTHS = [1440, 360];

const browser = await chromium.launch();
const merged = JSON.parse(readFileSync(OUT, 'utf8'));

for (const width of WIDTHS) {
  const ctx = await newLiveContext(browser, { viewport: { width, height: width > 800 ? 900 : 780 } });
  const page = await ctx.newPage();
  await gotoLive(page, URL_LIVE, { settleMs: 2500 });
  await dismissOverlays(page);
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });

  const data = await page.evaluate(() => {
    const rc = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
    const cs = (el, props) => { if (!el) return null; const c = getComputedStyle(el); const o = {}; for (const p of props) o[p] = c[p]; return o; };
    const T = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'letterSpacing', 'textTransform', 'textDecoration'];
    const B = ['backgroundColor', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'display', 'flexDirection', 'gridTemplateColumns', 'gridTemplateRows', 'gap', 'alignItems', 'justifyContent', 'position', 'overflow', 'marginTop', 'marginBottom', 'maxWidth', 'border', 'zIndex'];
    const dump = (el) => (el ? { tag: el.tagName.toLowerCase(), cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 120), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80), rect: rc(el), t: cs(el, T), b: cs(el, B) } : null);
    const tree = (el, depth) => {
      if (!el || depth < 0) return null;
      const o = dump(el);
      if (depth > 0) o.kids = [...el.children].map((k) => tree(k, depth - 1)).filter(Boolean);
      return o;
    };
    const q = (s, r = document) => r.querySelector(s);
    const qa = (s, r = document) => [...r.querySelectorAll(s)];
    const out = {};

    // featured-solutions: full card internals for first card + heading nodes for all
    const fs1 = q('.featured-solutions__card-grid');
    out.featuredCard = tree(fs1 ? fs1.children[0] : null, 4);
    out.featuredIntro = dump(qa('.featured-solutions *').find((e) => /Explore the breadth/.test(e.textContent) && e.children.length === 0));
    out.featuredHeadRow = tree(q('.featured-solutions .container-fluid > *'), 1);

    // insights: section header row, explore link, intro
    const ins = q('section.insights');
    out.insightsHeader = tree(qa(':scope > * > *', ins)[0], 2);
    out.insightsExplore = dump(qa('a', ins).find((a) => /explore all insights/i.test(a.textContent)));
    out.insightsCard = tree(q('.insights__slider-slide', ins), 4);
    out.insightsSliderNav = qa('button', ins).map((b) => ({ cls: String(b.className).slice(0, 60), rect: rc(b), aria: b.getAttribute('aria-label') }));

    // top-tabber: active panel internals
    const tt = q('section.top-tabber');
    out.topTabberPanel = tree(q('.tabs__content-item.active', tt), 4);
    out.topTabberIntro = dump(qa('p, div', tt).find((e) => /empower asset managers/i.test(e.textContent) && e.children.length === 0));
    out.topTabberTabList = dump(q('.tabs__nav-list, [role=tablist], ul', tt));
    out.topTabberActiveUnderline = cs(qa('button, [role=tab]', tt).find((b) => /Asset Management/.test(b.textContent)), ['borderBottom', 'boxShadow', 'backgroundImage']);

    // side-tabber active panel
    const stb = q('section.side-tabber');
    out.sideTabberPanel = tree(q('.tabs__content-item.active', stb), 4);
    out.sideTabberExplore = dump(qa('a', stb).find((a) => /explore/i.test(a.textContent)));

    // analyst-recognition: full structure 5 deep
    const ar = q('section.analyst-recognition');
    out.analystTree = tree(q(':scope > div', ar), 5);
    out.analystExplore = dump(qa('a', ar).find((a) => /explore all analyst/i.test(a.textContent)));

    // contact-us band in main: columns + form
    const cu = q('main section.contact-us');
    out.contactTree = tree(q(':scope > div', cu), 4);
    out.contactForm = dump(q('form', cu));
    out.contactInputs = qa('input, select, textarea, label, button', cu).slice(0, 30).map((e) => ({ tag: e.tagName.toLowerCase(), type: e.type || null, cls: String(e.className).slice(0, 60), text: (e.labels && e.labels[0] ? e.labels[0].textContent : e.textContent || e.placeholder || '').trim().slice(0, 50), rect: rc(e), b: cs(e, ['backgroundColor', 'border', 'borderRadius', 'height', 'fontSize', 'color']) }));

    // footer full structure
    out.footerTree = tree(q('#footer-section'), 5);

    // main bg + body link color
    out.mainBg = cs(q('main'), ['backgroundColor']);
    out.htmlBg = cs(document.documentElement, ['backgroundColor']);
    return out;
  });

  merged.widths[width].drill = data;
  await ctx.close();
  console.log(`drilled ${width}`);
}
await browser.close();
writeFileSync(OUT, JSON.stringify(merged, null, 1));
console.log('merged into', OUT);

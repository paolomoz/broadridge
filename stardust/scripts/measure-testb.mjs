/**
 * Phase 3(b) measurement probe for the /test-b home replica.
 * Lifts geometry + computed styles from live broadridge.com at 1440 and 360
 * BEFORE any authoring. Output: stardust/replica/test-b/measurements.json
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';

const URL_LIVE = process.argv[2] || 'https://www.broadridge.com/';
const OUT = 'stardust/replica/test-b/measurements.json';
const WIDTHS = [1440, 360];

const browser = await chromium.launch();
const result = { url: URL_LIVE, capturedAt: new Date().toISOString(), widths: {} };

for (const width of WIDTHS) {
  const ctx = await newLiveContext(browser, { viewport: { width, height: width > 800 ? 900 : 780 } });
  const page = await ctx.newPage();
  await gotoLive(page, URL_LIVE, { settleMs: 2500 });
  await dismissOverlays(page);
  await page.waitForTimeout(1200);
  // settle pass: scroll through the doc so lazy/entrance-animated content lands
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 800));
  });

  const data = await page.evaluate(() => {
    const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color',
      'textTransform', 'textAlign', 'backgroundColor', 'backgroundImage', 'paddingTop', 'paddingRight',
      'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'display', 'position', 'zIndex',
      'borderRadius', 'border', 'maxWidth', 'width', 'height', 'gap', 'gridTemplateColumns',
      'gridTemplateRows', 'flexDirection', 'alignItems', 'justifyContent', 'opacity', 'boxShadow',
      'top', 'left', 'right', 'bottom', 'overflow', 'objectFit', 'textDecoration'];
    const st = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const o = {};
      for (const p of PROPS) o[p] = cs[p];
      return o;
    };
    const rc = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const brief = (el) => (el ? { tag: el.tagName.toLowerCase(), cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 100), rect: rc(el) } : null);
    const node = (el, extraStyles = false) => (el ? {
      tag: el.tagName.toLowerCase(),
      cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 140),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90),
      rect: rc(el),
      styles: st(el),
      ...(extraStyles ? {} : {}),
    } : null);

    // occlusion probe: what paints at this element's text position?
    const occl = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const pts = [[r.x + 10, r.y + r.height / 2], [r.x + r.width / 2, r.y + r.height / 2]];
      return pts.map(([x, y]) => {
        if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) return 'offscreen';
        const hit = document.elementFromPoint(x, y);
        if (!hit) return null;
        const rel = hit === el ? 'self' : (el.contains(hit) ? 'descendant' : (hit.contains(el) ? 'ancestor' : 'OTHER'));
        return { hit: hit.tagName.toLowerCase() + (hit.className && typeof hit.className === 'string' ? `.${hit.className.split(' ')[0]}` : ''), rel };
      });
    };

    const q = (s, root = document) => root.querySelector(s);
    const qa = (s, root = document) => [...root.querySelectorAll(s)];
    const out = { scrollHeight: document.documentElement.scrollHeight, viewport: { w: innerWidth, h: innerHeight } };

    // ---------- header ----------
    const header = q('#site-header');
    const promoNav = q('#promo-nav');
    const mainNav = q('#main-nav');
    out.header = {
      wrapper: node(header),
      promoNav: node(promoNav),
      promoNavLinks: promoNav ? qa('a, button', promoNav).map((a) => node(a)) : [],
      mainNav: node(mainNav),
      logo: node(q('img', mainNav || header)),
      logoLink: brief(q('a', mainNav || header)),
      navItems: mainNav ? qa(':scope > ul > li, ul > li', mainNav).slice(0, 12).map((li) => ({
        item: node(li),
        link: node(q('a, button, span', li)),
      })) : [],
      searchBtn: node(qa('button', mainNav || header).find((b) => /search/i.test(b.textContent + (b.getAttribute('aria-label') || '')))),
      contactBtn: node(qa('a, button', mainNav || header).find((b) => /contact us/i.test(b.textContent))),
    };

    // ---------- hero ----------
    const hero = q('section.hero-deconstructed');
    if (hero) {
      const h1 = q('h1', hero);
      out.hero = {
        section: node(hero),
        children: qa(':scope > *', hero).map((c) => brief(c)),
        // two levels down often holds the columns
        grandchildren: qa(':scope > * > *', hero).map((c) => brief(c)),
        h1: node(h1),
        h1Occlusion: occl(h1),
        subcopy: node(qa('p, span', hero).find((e) => /tokenized markets/i.test(e.textContent))),
        badge: node(qa('*', hero).find((e) => e.children.length === 0 && /^(REPORT|PRESS RELEASE)$/.test(e.textContent.trim()))),
        cta: node(qa('a', hero).find((a) => /let'?s go/i.test(a.textContent))),
        ctaOcclusion: occl(qa('a', hero).find((a) => /let'?s go/i.test(a.textContent))),
        sideCards: qa('a', hero).filter((a) => /(payward|tokenization pulse)/i.test(a.textContent)).map((a) => ({
          card: node(a),
          heading: node(q('h3, h4, strong', a)),
          badge: node(qa('span, div', a).find((e) => e.children.length === 0 && /^(REPORT|PRESS RELEASE)$/i.test(e.textContent.trim()))),
        })),
        images: qa('img', hero).map((i) => ({ src: i.src.split('/').pop(), rect: rc(i), styles: (() => { const s = st(i); return { position: s.position, opacity: s.opacity, zIndex: s.zIndex, top: s.top, left: s.left, right: s.right, bottom: s.bottom, width: s.width, height: s.height, objectFit: s.objectFit }; })() })),
      };
    }

    // ---------- generic section snapshots ----------
    const secSel = ['section.featured-solutions', 'section.insights', 'section.top-tabber', 'section.side-tabber', 'section.analyst-recognition', 'main section.contact-us'];
    out.sections = {};
    for (const sel of secSel) {
      const s = q(sel);
      if (!s) { out.sections[sel] = null; continue; }
      const heading = q('h1,h2,h3', s);
      const entry = {
        section: node(s),
        heading: node(heading),
        headingOcclusion: occl(heading),
        children: qa(':scope > *', s).map((c) => brief(c)),
      };
      // card grids: find the densest repeating-children container
      const grids = qa('ul, div', s).filter((el) => el.children.length >= 3
        && [...el.children].every((c) => c.tagName === el.children[0].tagName)
        && el.children[0].querySelector('a, h3, h4, img')
        && rc(el) && rc(el).h > 100).slice(0, 3);
      entry.grids = grids.map((g) => ({
        container: node(g),
        cells: [...g.children].slice(0, 8).map((c) => ({
          cell: brief(c),
          heading: brief(q('h3, h4, h2, strong', c)),
          badge: node(qa('span, div', c).find((e) => e.children.length === 0 && e.textContent.trim().length > 1 && e.textContent.trim().length < 30 && /^[A-Z0-9\s]+$/.test(e.textContent.trim()))),
          img: brief(q('img', c)),
          hasSvgArrow: !!q('svg', c),
          link: (q('a', c) || (c.tagName === 'A' ? c : null)) ? node(q('a', c) || c) : null,
        })),
      }));
      // tabbers: tab list + active panel media/text order
      if (/tabber/.test(sel)) {
        const tabs = qa('[role=tab], button', s).filter((b) => b.textContent.trim().length > 2 && b.textContent.trim().length < 40);
        entry.tabs = tabs.slice(0, 10).map((t) => ({ ...brief(t), text: t.textContent.trim(), selected: t.getAttribute('aria-selected') || (t.className.toString().match(/active|selected/) ? 'class-active' : null), styles: (() => { const S = st(t); return { fontSize: S.fontSize, fontWeight: S.fontWeight, color: S.color, backgroundColor: S.backgroundColor, borderRadius: S.borderRadius, border: S.border, padding: `${S.paddingTop} ${S.paddingRight} ${S.paddingBottom} ${S.paddingLeft}` }; })() }));
        const panel = qa('[role=tabpanel], .tab-panel, .tab-content', s).find((p) => rc(p) && rc(p).h > 50) || null;
        if (panel) {
          entry.activePanel = { panel: brief(panel), children: qa(':scope > *', panel).map((c) => brief(c)), img: brief(q('img', panel)), textBlock: brief(q('h3, h2, p', panel) ? q('h3, h2, p', panel).parentElement : null) };
        }
      }
      out.sections[sel] = entry;
    }

    // ---------- footer ----------
    const footer = q('#footer-section');
    if (footer) {
      out.footer = {
        section: node(footer),
        children: qa(':scope > *', footer).map((c) => brief(c)),
        columns: qa(':scope > div > div, :scope > div', footer).slice(0, 10).map((c) => brief(c)),
        uls: qa('ul', footer).map((u) => ({ ...brief(u), display: getComputedStyle(u).display, flexDirection: getComputedStyle(u).flexDirection, liCount: u.children.length, firstLi: (u.children[0] || {}).textContent ? u.children[0].textContent.trim().slice(0, 40) : '' })),
        socialImgs: qa('img', footer).map((i) => ({ src: i.src.split('/').pop(), rect: rc(i) })),
        headings: qa('h2,h3,h4,strong', footer).slice(0, 12).map((h) => node(h)),
        phoneRow: node(qa('a', footer).find((a) => a.href.startsWith('tel:'))),
        legalLinks: qa('a', footer).filter((a) => /privacy|legal|accessibility|terms/i.test(a.textContent)).slice(0, 8).map((a) => brief(a)),
      };
    }

    // ---------- type ramp / tokens ----------
    out.typeRamp = {
      body: st(document.body),
      h1: node(q('main h1')),
      h2s: qa('main h2').slice(0, 6).map((h) => ({ text: h.textContent.trim().slice(0, 50), styles: (() => { const S = st(h); return { fontFamily: S.fontFamily, fontSize: S.fontSize, fontWeight: S.fontWeight, lineHeight: S.lineHeight, letterSpacing: S.letterSpacing, color: S.color, textTransform: S.textTransform }; })(), rect: rc(h) })),
      h3s: qa('main h3').slice(0, 4).map((h) => ({ text: h.textContent.trim().slice(0, 50), styles: (() => { const S = st(h); return { fontFamily: S.fontFamily, fontSize: S.fontSize, fontWeight: S.fontWeight, lineHeight: S.lineHeight, color: S.color }; })() })),
    };
    return out;
  });

  // ---------- scroll-state header behavior ----------
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(700);
  data.scrollState = await page.evaluate(() => {
    const rc = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), yViewport: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const el = (s) => document.querySelector(s);
    const cs = (s) => { const e = el(s); return e ? { position: getComputedStyle(e).position, top: getComputedStyle(e).top, transform: getComputedStyle(e).transform, rect: rc(e) } : null; };
    return {
      scrollY: window.scrollY,
      bodyClasses: document.body.className,
      headerClasses: el('#site-header') ? el('#site-header').className : null,
      header: cs('#site-header'),
      promoNav: cs('#promo-nav'),
      mainNav: cs('#main-nav'),
    };
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  data.topState = await page.evaluate(() => {
    const rc = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), yViewport: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const el = (s) => document.querySelector(s);
    const cs = (s) => { const e = el(s); return e ? { position: getComputedStyle(e).position, top: getComputedStyle(e).top, rect: rc(e) } : null; };
    return { scrollY: window.scrollY, headerClasses: el('#site-header') ? el('#site-header').className : null, header: cs('#site-header'), promoNav: cs('#promo-nav'), mainNav: cs('#main-nav') };
  });

  result.widths[width] = data;
  await ctx.close();
  console.log(`measured ${width}: docHeight=${data.scrollHeight}`);
}

await browser.close();
mkdirSync('stardust/replica/test-b', { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`wrote ${OUT}`);

// Supplementary brand-surface pass (extract Phase 3 support).
// Visits each captured page, runs an in-page style audit, intercepts font
// files, saves logo + favicon, and writes raw per-page brand data to
// stardust/current/_brand-raw.json for aggregation.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const PAGES = [
  { slug: 'index', url: 'https://www.broadridge.com/' },
  { slug: 'who-we-serve-capital-markets', url: 'https://www.broadridge.com/who-we-serve/capital-markets' },
  { slug: 'capability-governance-and-regulatory-compliance-proxy-services-issuer-proxy', url: 'https://www.broadridge.com/capability/governance-and-regulatory-compliance/proxy-services/issuer-proxy' },
  { slug: 'insights-2026-digital-transformation-study', url: 'https://www.broadridge.com/insights/2026-digital-transformation-study' },
  { slug: 'about', url: 'https://www.broadridge.com/about/' },
];
const OUT = 'stardust/current';

function audit() {
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const alpha = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c.startsWith('#') || /^[a-z]/.test(c) ? 1 : 0; const p = m[1].split(','); return p.length === 4 ? +p[3] : 1; };
  const colors = {}; // value -> {count, usedAs:Set, sels:Set}
  const addColor = (val, used, sel, w) => {
    if (!val || val === 'transparent' || alpha(val) === 0) return;
    const k = val;
    colors[k] = colors[k] || { count: 0, usedAs: {}, sels: {} };
    colors[k].count += w;
    colors[k].usedAs[used] = 1;
    if (Object.keys(colors[k].sels).length < 4) colors[k].sels[sel] = 1;
  };
  const radii = {}; const shadows = {}; const gradients = {};
  const headings = []; const bodySamples = [];
  const els = [...document.querySelectorAll('body *')].filter(vis).slice(0, 6000);
  for (const el of els) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const area = Math.min(r.width * r.height, 1440 * 900);
    const w = Math.max(1, Math.round(Math.sqrt(area) / 10));
    const sel = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '');
    addColor(cs.backgroundColor, 'background', sel, w);
    if (el.textContent.trim() && el.children.length === 0) addColor(cs.color, 'text', sel, w);
    if (cs.borderTopWidth !== '0px') addColor(cs.borderTopColor, 'border', sel, 1);
    const br = cs.borderTopLeftRadius;
    if (br && br !== '0px') radii[br] = (radii[br] || 0) + 1;
    if (cs.boxShadow && cs.boxShadow !== 'none') shadows[cs.boxShadow] = (shadows[cs.boxShadow] || 0) + 1;
    const bg = cs.backgroundImage;
    if (bg && bg.includes('gradient')) gradients[bg] = (gradients[bg] || 0) + 1;
    if (/^H[1-6]$/.test(el.tagName)) {
      headings.push({ level: +el.tagName[1], text: el.textContent.trim().slice(0, 120), fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, transform: cs.textTransform });
    }
    if ((el.tagName === 'P' || el.tagName === 'LI') && bodySamples.length < 40 && el.textContent.trim().length > 40) {
      bodySamples.push({ tag: el.tagName, fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily, lineHeight: cs.lineHeight });
    }
  }
  // buttons
  const btnEls = [...document.querySelectorAll('a,button')].filter(vis).filter((el) => {
    const cs = getComputedStyle(el);
    return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || (cs.borderTopWidth !== '0px' && cs.borderTopStyle === 'solid');
  }).slice(0, 60);
  const buttons = btnEls.map((el) => {
    const cs = getComputedStyle(el);
    return { label: el.textContent.trim().slice(0, 40), background: cs.backgroundColor, color: cs.color, borderRadius: cs.borderTopLeftRadius, padding: cs.padding, fontWeight: cs.fontWeight, fontSize: cs.fontSize, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, shadow: cs.boxShadow, cls: (typeof el.className === 'string' ? el.className : '').slice(0, 80) };
  });
  // inputs
  const inp = document.querySelector('input[type="text"],input[type="email"],input:not([type])');
  let inputs = null;
  if (inp) { const cs = getComputedStyle(inp); inputs = { borderRadius: cs.borderTopLeftRadius, padding: cs.padding, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, background: cs.backgroundColor, fontSize: cs.fontSize }; }
  // section spacing
  const sections = [...document.querySelectorAll('section, main > div')].filter(vis).slice(0, 40);
  const pads = {};
  for (const s of sections) { const cs = getComputedStyle(s); for (const p of [cs.paddingTop, cs.paddingBottom]) if (p !== '0px') pads[p] = (pads[p] || 0) + 1; }
  // container width
  const conts = [...document.querySelectorAll('div')].filter(vis).map((d) => getComputedStyle(d).maxWidth).filter((m) => m.endsWith('px'));
  const contFreq = {}; for (const c of conts) contFreq[c] = (contFreq[c] || 0) + 1;
  // logo
  let logo = null;
  const headerSvg = document.querySelector('header svg, [role="banner"] svg, a[href="/"] svg');
  const headerImg = document.querySelector('header img[src*="logo" i], header img[class*="logo" i], img[alt*="logo" i], header a[href="/"] img');
  if (headerSvg) logo = { source: 'inline-svg', sourceSelector: 'header svg', svg: headerSvg.outerHTML, width: headerSvg.getBoundingClientRect().width, height: headerSvg.getBoundingClientRect().height };
  else if (headerImg) logo = { source: 'img', sourceSelector: 'header img', url: headerImg.currentSrc || headerImg.src, width: headerImg.naturalWidth, height: headerImg.naturalHeight };
  // favicon
  const fav = document.querySelector('link[rel~="icon"]');
  const touch = document.querySelector('link[rel="apple-touch-icon"]');
  // font-face rules
  const fontFaces = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules || []) {
      if (rule instanceof CSSFontFaceRule) fontFaces.push({ cssText: rule.cssText, family: rule.style.getPropertyValue('font-family'), weight: rule.style.getPropertyValue('font-weight'), style: rule.style.getPropertyValue('font-style'), display: rule.style.getPropertyValue('font-display'), src: rule.style.getPropertyValue('src') });
    }
  }
  // icon font
  let iconFont = null;
  const iconEl = document.querySelector('[class^="icon-"], [class*=" icon-"]');
  if (iconEl) { const cs = getComputedStyle(iconEl, '::before'); if (cs.content && cs.content !== 'none' && cs.content !== 'normal') iconFont = { family: cs.fontFamily, sample: cs.content }; }
  // nav + footer
  const navItems = [...document.querySelectorAll('header nav a, header nav button')].filter(vis).map((a) => a.textContent.trim()).filter(Boolean).slice(0, 15);
  const footerHeadings = [...document.querySelectorAll('footer h2, footer h3, footer h4, footer [class*="title" i]')].map((h) => h.textContent.trim()).filter(Boolean).slice(0, 12);
  return { colors, radii, shadows, gradients, headings, bodySamples, buttons, inputs, pads, contFreq, logo, favicon: fav ? fav.href : null, appleTouchIcon: touch ? touch.href : null, fontFaces, iconFont, navItems, footerHeadings };
}

const browser = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'], ignoreDefaultArgs: ['--enable-automation'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });

const fontFiles = {};
ctx.on('response', async (resp) => {
  const u = resp.url();
  if (/\.(woff2?|ttf|otf)(\?|$)/i.test(u) && resp.ok()) {
    try { fontFiles[u] = await resp.body(); } catch { }
  }
});

const results = {};
for (const { slug, url } of PAGES) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  // consent (first page mostly)
  for (const s of ['#onetrust-accept-btn-handler', '[aria-label*="Accept" i]', 'button[id*="accept" i]', 'button[class*="accept" i]']) {
    const el = await page.$(s); if (el) { await el.click().catch(() => {}); await page.waitForTimeout(400); break; }
  }
  for (let y = 0; y <= 1; y += 0.34) { await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), y); await page.waitForTimeout(350); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  results[slug] = await page.evaluate(audit);
  console.log('[brand] audited', slug);
  await page.close();
}

// save fonts
await mkdir(path.join(OUT, 'assets', 'fonts'), { recursive: true });
const savedFonts = [];
for (const [u, buf] of Object.entries(fontFiles)) {
  const base = path.basename(new URL(u).pathname);
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 8);
  const name = base.replace(/(\.[a-z0-9]+)$/i, `-${hash}$1`);
  await writeFile(path.join(OUT, 'assets', 'fonts', name), buf);
  savedFonts.push({ url: u, localPath: `stardust/current/assets/fonts/${name}`, bytes: buf.length });
}

// save logo + favicon
const home = results['index'];
await mkdir(path.join(OUT, 'assets'), { recursive: true });
if (home.logo?.svg) await writeFile(path.join(OUT, 'assets', 'logo.svg'), home.logo.svg);
else if (home.logo?.url) {
  const r = await ctx.request.get(home.logo.url);
  const ext = path.extname(new URL(home.logo.url).pathname) || '.png';
  await writeFile(path.join(OUT, 'assets', `logo${ext}`), await r.body());
}
if (home.favicon) {
  const r = await ctx.request.get(home.favicon);
  if (r.ok()) {
    const ext = path.extname(new URL(home.favicon).pathname) || '.ico';
    await writeFile(path.join(OUT, 'assets', `favicon${ext}`), await r.body());
    home.faviconSaved = `stardust/current/assets/favicon${ext}`;
  }
}
await writeFile(path.join(OUT, '_brand-raw.json'), JSON.stringify({ pages: results, savedFonts }, null, 1));
console.log('[brand] done. fonts:', savedFonts.length);
await browser.close();

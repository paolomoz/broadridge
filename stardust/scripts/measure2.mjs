import { chromium } from 'playwright';
const b = await chromium.launch();
for (const url of process.argv.slice(2)) {
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await pg.goto(url, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2500);
  for (const s of ['#onetrust-accept-btn-handler', 'button:has-text("Accept all")']) {
    const el = await pg.$(s); if (el) { await el.click().catch(() => {}); break; }
  }
  await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => {
    const q = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r2 = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { x: Math.round(r2.x), y: Math.round(r2.y), w: Math.round(r2.width), h: Math.round(r2.height), fs: cs.fontSize }; };
    const nav = [...document.querySelectorAll('header a, header span, header li')].find((e) => e.textContent.trim() === 'Who we serve');
    const navR = nav ? nav.getBoundingClientRect() : null;
    const h2 = [...document.querySelectorAll('h1,h2')].find((e) => e.textContent.trim() === 'NAVIGATE');
    const h2R = h2 ? h2.getBoundingClientRect() : null;
    return {
      logo: q('header img'),
      whoWeServe: navR ? { x: Math.round(navR.x), y: Math.round(navR.y) } : null,
      navigate: h2R ? { x: Math.round(h2R.x), y: Math.round(h2R.y), h: Math.round(h2R.height), fs: h2 ? getComputedStyle(h2).fontSize : null } : null,
      heroPanel: q('.hero-deconstructed .card, .hero-carousel > div:first-child'),
      featured: (() => { const e = [...document.querySelectorAll('h2')].find((x) => x.textContent.trim() === 'Featured solutions'); return e ? Math.round(e.getBoundingClientRect().y) : null; })(),
    };
  });
  console.log(url.includes('localhost') ? 'EDS ' : 'LIVE', JSON.stringify(r));
  await pg.close();
}
await b.close();

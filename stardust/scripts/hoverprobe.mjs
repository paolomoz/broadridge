import { chromium } from 'playwright';
import { newLiveContext, gotoLive, dismissOverlays } from '/Users/paolo/stardust/2026-08/broadridge/scripts/diff/live-session.mjs';
const b = await chromium.launch();
const ctx = await newLiveContext(b, { viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
await gotoLive(pg, 'https://www.broadridge.com/', { settleMs: 3000 });
await dismissOverlays(pg);
await pg.waitForTimeout(800);
const PROPS = ['backgroundColor','color','textDecorationLine','transform','opacity','boxShadow','translate'];
const grab = (el, arg) => {
  const out = { self: null, subs: {} };
  const read = (t) => { const cs = getComputedStyle(t); const o = {}; arg.props.forEach((p) => { o[p] = cs[p]; }); return o; };
  out.self = read(el);
  for (const [k, s] of Object.entries(arg.subs)) { const t = el.querySelector(s); out.subs[k] = t ? read(t) : null; }
  out.transition = getComputedStyle(el).transitionProperty + ' | ' + getComputedStyle(el).transitionDuration;
  return out;
};
async function probe(label, finder, subs) {
  const h = await pg.evaluateHandle(finder);
  const el = h.asElement();
  if (!el) { console.log(label, 'MISS'); return; }
  const arg = { props: PROPS, subs: subs || {} };
  const before = await el.evaluate(grab, arg);
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(400);
  const box = await el.boundingBox();
  if (!box) { console.log(label, 'NO-BOX'); return; }
  await pg.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 40));
  await pg.waitForTimeout(500);
  const after = await el.evaluate(grab, arg);
  const diff = {};
  PROPS.forEach((p) => { if (before.self[p] !== after.self[p]) diff[p] = [before.self[p], after.self[p]]; });
  for (const [k, sb] of Object.entries(before.subs)) {
    if (!sb || !after.subs[k]) continue;
    PROPS.forEach((p) => { if (sb[p] !== after.subs[k][p]) diff[`${k}.${p}`] = [sb[p], after.subs[k][p]]; });
  }
  console.log(label, JSON.stringify(diff), 'TRANS:', before.transition);
  await pg.mouse.move(5, 5); await pg.waitForTimeout(400);
}
await probe('featuredCard', () => [...document.querySelectorAll('#main-content a')].find((a) => /proxy-services/.test(a.href) && a.getBoundingClientRect().width > 0), { icon: 'img', title: '.heading', arrow: '.card__cta svg' });
await probe('heroCta', () => [...document.querySelectorAll('#main-content a.cta')].find((a) => /hub\/tokenization/.test(a.href) && a.getBoundingClientRect().width > 0), {});
await probe('primaryBtn', () => [...document.querySelectorAll('#main-content a')].find((a) => /insight-pages\/broadridge-insights/.test(a.href) && a.getBoundingClientRect().width > 0), {});
await probe('insightCard', () => [...document.querySelectorAll('#main-content a')].find((a) => /real-transformation/.test(a.href) && a.getBoundingClientRect().width > 0), { badge: '.badge', arrow: '.card__cta svg', img: 'img' });
await probe('heroSideCard', () => [...document.querySelectorAll('#main-content a')].find((a) => /tokenization-pulse-study/.test(a.href) && a.getBoundingClientRect().width > 0), { badge: '.badge', h3: 'h3' });
await probe('awardCard', () => [...document.querySelectorAll('#main-content a')].find((a) => /idc-fintech-100/.test(a.href) && a.getBoundingClientRect().width > 0), { badge: '.badge', h2: 'h2' });
await probe('navLink', () => [...document.querySelectorAll('header button, header a, header span')].find((e) => e.textContent.trim() === 'Who we serve' && e.getBoundingClientRect().width > 0), {});
await probe('tabTop', () => [...document.querySelectorAll('#main-content button')].find((e) => /Capital Markets/.test(e.textContent) && e.getBoundingClientRect().width > 0), {});
await probe('sideTab', () => [...document.querySelectorAll('#main-content button')].find((e) => /Front Office/.test(e.textContent) && e.getBoundingClientRect().width > 0), {});
await probe('footerLink', () => [...document.querySelectorAll('footer a')].find((a) => /about\//.test(a.href) && a.textContent.trim() === 'About Broadridge' && a.getBoundingClientRect().width > 0), {});
await b.close();

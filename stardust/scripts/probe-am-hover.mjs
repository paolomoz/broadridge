import { chromium } from 'playwright';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';
const b = await chromium.launch();
const ctx = await newLiveContext(b, { viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
await gotoLive(pg, 'https://www.broadridge.com/who-we-serve/asset-management', { settleMs: 2500 });
await dismissOverlays(pg);
const PROPS = ['backgroundColor', 'color', 'boxShadow', 'transform', 'borderColor', 'opacity'];
const grab = (el, arg) => {
  const read = (t) => { const cs = getComputedStyle(t); const o = {}; arg.props.forEach((p) => { o[p] = cs[p]; }); return o; };
  const out = { self: read(el), subs: {} };
  for (const [k, s] of Object.entries(arg.subs)) { const t = el.querySelector(s); out.subs[k] = t ? read(t) : null; }
  return out;
};
async function probe(label, finder, subs) {
  const h = await pg.evaluateHandle(finder);
  const el = h.asElement();
  if (!el) { console.log(label, 'MISS'); return; }
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(300);
  const arg = { props: PROPS, subs: subs || {} };
  const before = await el.evaluate(grab, arg);
  const box = await el.boundingBox();
  if (!box) { console.log(label, 'NO-BOX'); return; }
  await pg.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 40));
  await pg.waitForTimeout(450);
  const after = await el.evaluate(grab, arg);
  const diff = {};
  PROPS.forEach((p) => { if (before.self[p] !== after.self[p]) diff[p] = [before.self[p], after.self[p]]; });
  for (const [k, sb] of Object.entries(before.subs)) {
    if (!sb || !after.subs[k]) continue;
    PROPS.forEach((p) => { if (sb[p] !== after.subs[k][p]) diff[`${k}.${p}`] = [sb[p], after.subs[k][p]]; });
  }
  console.log(label, JSON.stringify(diff));
  await pg.mouse.move(5, 400); await pg.waitForTimeout(300);
}
await probe('bentoPhoto', () => [...document.querySelectorAll('#main-content a')].find((a) => /awards-and-recognition/.test(a.href) && a.className.includes('card__media-cover') && a.getBoundingClientRect().width > 0), { cta: '.card__cta' });
await probe('bentoSub', () => [...document.querySelectorAll('#main-content a')].filter((a) => /awards-and-recognition/.test(a.href) && a.className.includes('bg-neutral-100') && a.getBoundingClientRect().width > 0)[0], { cta: '.card__cta' });
await probe('carouselNext', () => [...document.querySelectorAll('section.c2-text-slider .slider-button-next')].find((e) => getComputedStyle(e).display !== 'none'), {});
await probe('heroH1zone', () => document.querySelector('section.hero-general .hero-general__content-wrap'), {});
await probe('statSlide', () => document.querySelector('.key-stats__slider-slide'), {});
await b.close();

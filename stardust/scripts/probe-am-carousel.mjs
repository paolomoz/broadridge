import { chromium } from 'playwright';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';
const b = await chromium.launch();
const ctx = await newLiveContext(b, { viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
await gotoLive(pg, 'https://www.broadridge.com/who-we-serve/asset-management', { settleMs: 2500 });
await dismissOverlays(pg);
await pg.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
});
// analyze both text-sliders
const info = await pg.evaluate(() => {
  const out = [];
  document.querySelectorAll('section.c2-text-slider').forEach((sec) => {
    const wrap = sec.querySelector('.swiper-wrapper');
    const slides = [...sec.querySelectorAll('.c2-text-slider__slider-slide')];
    const bullets = [...sec.querySelectorAll('.swiper-pagination-bullet')];
    const next = sec.querySelector('.slider-button-next');
    const prev = sec.querySelector('.slider-button-prev');
    const r = (e) => { if (!e) return null; const x = e.getBoundingClientRect(); return [Math.round(x.y + scrollY), Math.round(x.height), Math.round(x.x), Math.round(x.width)]; };
    out.push({
      title: (sec.querySelector('.c2-text-slider__title') || {}).textContent?.trim().slice(0, 40),
      slideCount: slides.length,
      slideRects: slides.map((s) => r(s)),
      slideTexts: slides.map((s) => s.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)),
      wrapperTransform: wrap ? getComputedStyle(wrap).transform : null,
      wrapperTransition: wrap ? getComputedStyle(wrap).transitionDuration : null,
      bullets: bullets.length,
      bulletRects: bullets.slice(0, 3).map((x) => r(x)),
      bulletActive: bullets.findIndex((x) => x.classList.contains('swiper-pagination-bullet-active')),
      next: next ? { rect: r(next), disabled: next.disabled, cls: String(next.className).slice(0, 80), display: getComputedStyle(next).display, bg: getComputedStyle(next).backgroundColor, border: getComputedStyle(next).border } : null,
      prev: prev ? { rect: r(prev), disabled: prev.disabled, display: getComputedStyle(prev).display } : null,
      sliderOverflow: sec.querySelector('.c2-text-slider__slider') ? getComputedStyle(sec.querySelector('.c2-text-slider__slider')).overflow : null,
    });
  });
  return out;
});
console.log(JSON.stringify(info, null, 1));
// click NEXT on slider 2 and observe
const clicked = await pg.evaluate(() => {
  const sec = document.querySelectorAll('section.c2-text-slider')[1];
  sec.scrollIntoView({ block: 'center' });
  const next = sec.querySelector('.slider-button-next');
  if (next) next.click();
  return !!next;
});
await pg.waitForTimeout(300);
const mid = await pg.evaluate(() => {
  const sec = document.querySelectorAll('section.c2-text-slider')[1];
  const wrap = sec.querySelector('.swiper-wrapper');
  return { transform: getComputedStyle(wrap).transform, transition: getComputedStyle(wrap).transitionDuration + ' ' + getComputedStyle(wrap).transitionTimingFunction };
});
await pg.waitForTimeout(600);
const after = await pg.evaluate(() => {
  const sec = document.querySelectorAll('section.c2-text-slider')[1];
  const wrap = sec.querySelector('.swiper-wrapper');
  const bullets = [...sec.querySelectorAll('.swiper-pagination-bullet')];
  const prev = sec.querySelector('.slider-button-prev');
  return { transform: getComputedStyle(wrap).transform, activeBullet: bullets.findIndex((x) => x.classList.contains('swiper-pagination-bullet-active')), prevDisabled: prev ? prev.disabled : null };
});
console.log('clicked:', clicked, 'mid:', JSON.stringify(mid), 'after:', JSON.stringify(after));
await b.close();

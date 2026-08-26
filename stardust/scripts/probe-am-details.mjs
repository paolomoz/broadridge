import { chromium } from 'playwright';
import { newLiveContext, gotoLive, dismissOverlays } from '../../scripts/diff/live-session.mjs';
const b = await chromium.launch();
const run = async (width) => {
  const ctx = await newLiveContext(b, { viewport: { width, height: 900 } });
  const pg = await ctx.newPage();
  await gotoLive(pg, 'https://www.broadridge.com/who-we-serve/asset-management', { settleMs: 2500 });
  await dismissOverlays(pg);
  await pg.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } });
  const r = await pg.evaluate(() => {
    const sec = document.querySelectorAll('section.c2-text-slider')[1];
    const t = sec.querySelector('.c2-text-slider__slider-slide-title');
    const d = sec.querySelector('.c2-text-slider__slider-slide .body-3, .c2-text-slider__slider-slide .text-atom:not(.c2-text-slider__slider-slide-title)');
    const g = (e, ps) => { if (!e) return null; const cs = getComputedStyle(e); const o = {}; ps.forEach((p) => { o[p] = cs[p]; }); const x = e.getBoundingClientRect(); o.rect = [Math.round(x.y + scrollY), Math.round(x.height), Math.round(x.x), Math.round(x.width)]; return o; };
    const slides = [...sec.querySelectorAll('.c2-text-slider__slider-slide')];
    const bullets = [...sec.querySelectorAll('.swiper-pagination-bullet')];
    return JSON.stringify({
      vw: innerWidth,
      title: g(t, ['fontSize', 'fontWeight', 'lineHeight', 'color', 'marginBottom']),
      desc: g(d, ['fontSize', 'fontWeight', 'lineHeight', 'color', 'marginTop']),
      slideB: g(slides[0], ['borderLeft', 'paddingLeft', 'paddingTop', 'gap', 'display', 'flexDirection']),
      slideRects: slides.map((s) => { const x = s.getBoundingClientRect(); return [Math.round(x.x), Math.round(x.width)]; }),
      bullets: bullets.length,
      s1controls: (() => { const s1 = document.querySelectorAll('section.c2-text-slider')[0]; const bb = [...s1.querySelectorAll('.swiper-pagination-bullet')]; const n = s1.querySelector('.slider-button-next'); return { bullets: bb.length, nextDisplay: n ? getComputedStyle(n).display : null }; })(),
      statsControls: (() => { const st = document.querySelector('section.key-stats'); const bb = [...st.querySelectorAll('.swiper-pagination-bullet')]; const n = st.querySelector('.slider-button-next'); return { bullets: bb.length, nextDisplay: n ? getComputedStyle(n).display : null, slideW: [...st.querySelectorAll('.key-stats__slider-slide')].map((s) => Math.round(s.getBoundingClientRect().width)) }; })(),
    });
  });
  console.log(`W${width}:`, r);
  await ctx.close();
};
await run(1440);
await run(360);
await b.close();

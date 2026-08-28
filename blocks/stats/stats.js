/* stats — Figma web kit C4 Key Stats (617:57448) + B2 Stat Banner
   (1589:90232, variant `stats (banner)`); shared unit A17 Stat (2127:35608).
   Rows are classified structurally (authors may omit header/CTA):
   heading row -> stats-header, strong rows -> stat tiles, link row ->
   stats-cta, picture row (banner) -> background image.
   Count-up: kit prototype boards 5129:64917 / 5111:53256 document
   NUMBER.SHIFT on "Stats (In View)" — motion.duration.extra-long4
   (1000ms), motion.easing.standard.decelerate cubic-bezier(0,0,0,1).
   Honors prefers-reduced-motion (final values render immediately). */

const ARROW_LEFT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.86595 8.47797C2.60089 8.21821 2.60135 7.7932 2.8607 7.53403V7.52737L6.85777 3.53305C7.11758 3.26676 7.53727 3.26676 7.80375 3.53305C8.06356 3.79268 8.06356 4.21208 7.80375 4.47837L4.93916 7.34099H12.6672C13.0336 7.34099 13.3333 7.6339 13.3333 8.00671C13.3333 8.37285 13.0336 8.67243 12.6672 8.67243H4.95248L7.80963 11.5276C8.06944 11.7806 8.06944 12.2067 7.80963 12.4663H7.80297C7.6764 12.5861 7.50319 12.6593 7.32999 12.6593L7.33731 12.6667C7.15745 12.6667 6.98424 12.5934 6.86433 12.4736L2.86725 8.47928C2.86682 8.47885 2.86638 8.47841 2.86595 8.47797Z" fill="currentColor"/>
</svg>`;

const ARROW_RIGHT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0537 7.33721L8.19357 4.47924C7.92691 4.21277 7.92691 3.79308 8.19291 3.53327C8.45291 3.2668 8.87291 3.2668 9.13957 3.5326L13.1396 7.52964C13.3069 7.69252 13.3665 7.92711 13.3185 8.1429C13.2843 8.302 13.1927 8.44047 13.0666 8.53545L9.13303 12.4661C9.00636 12.5861 8.83303 12.6593 8.6597 12.6593L8.66636 12.6667C8.48636 12.6667 8.31303 12.5934 8.19303 12.4735C7.92636 12.2137 7.92636 11.7873 8.18636 11.5275V11.5208L11.0398 8.66955H3.33333C2.96 8.66955 2.66667 8.36978 2.66667 8.00338C2.66667 7.63032 2.96 7.33721 3.33333 7.33721H11.0537Z" fill="currentColor"/>
</svg>`;

/* A17 anatomy: Top Stat numeral (Book weight — unwrap the authored
   strong) + Bottom Info caption, a boolean layer (2126:20187/20189) */
function decorateStat(cell) {
  cell.classList.add('stat');
  const strong = cell.querySelector('strong');
  if (strong) {
    // isolate the numeral in its own p — aem.js wrapTextNodes may have
    // wrapped the whole cell (numeral + caption) into a single <p>
    const value = document.createElement('p');
    value.className = 'stat-value';
    const host = strong.closest('p') || strong;
    host.before(value);
    value.append(...strong.childNodes);
    strong.remove();
    if (host !== strong) {
      if (!host.textContent.trim() && !host.querySelector('picture, img')) host.remove();
      else if (host.querySelector('p, ul, ol')) host.replaceWith(...host.childNodes);
    }
  }
  cell.querySelectorAll('p:not(.stat-value)').forEach((p) => p.classList.add('stat-info'));
}

/* cubic-bezier(0, 0, 0, 1) = motion.easing.standard.decelerate:
   x(u) = u^3 so u = cbrt(p), y = 3u^2 - 2u^3 */
const decelerate = (p) => {
  const u = Math.cbrt(p);
  return u * u * (3 - 2 * u);
};

function tokenMs(name, fallback) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const NUM_RE = /\d[\d,]*(?:\.\d+)?/g;

/* NUMBER.SHIFT: only the numeric runs count up ("$ 0 trillion" -> "$100
   trillion", proto board 5129:64917); prefix/suffix text stays put */
function countUpTargets(block) {
  return [...block.querySelectorAll('.stat-value')]
    .map((el) => {
      const finalText = el.textContent;
      NUM_RE.lastIndex = 0; // global regex: reset before test
      if (!NUM_RE.test(finalText)) return null;
      const render = (p) => {
        el.textContent = finalText.replace(NUM_RE, (m) => {
          const target = parseFloat(m.replace(/,/g, ''));
          const decimals = (m.split('.')[1] || '').length;
          const v = (target * p).toFixed(decimals);
          return m.includes(',')
            ? Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals })
            : v;
        });
      };
      return { render, finish: () => { el.textContent = finalText; } };
    })
    .filter(Boolean);
}

function setupCountUp(block) {
  const targets = countUpTargets(block);
  if (!targets.length) return;
  // reduced motion: authored (final) values stay rendered, no animation
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const duration = tokenMs('--motion-duration-extra-long4', 1000);
  targets.forEach((t) => t.render(0));
  const run = () => {
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - start) / duration);
      if (p < 1) {
        targets.forEach((t) => t.render(decelerate(p)));
        requestAnimationFrame(frame);
      } else {
        targets.forEach((t) => t.finish());
        block.dataset.countUp = 'done';
      }
    };
    requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver((entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) {
      obs.disconnect();
      run();
    }
  }, { threshold: 0.2 });
  io.observe(block);
}

/* C4 wayfinding (737:73286): A22 tabs left + arrow pair right; shown
   only when the stat row overflows. Page step = viewport + gutter
   (reproduces the kit tab counts: 2 at desktop/tablet, 617:57447 /
   746:16951). */
function setupCarousel(block, row) {
  const way = document.createElement('div');
  way.className = 'stats-wayfinding wayfinding';
  way.innerHTML = `<div class="stats-tabs wayfinding-tabs"></div>
    <div class="stats-arrows wayfinding-arrows">
      <button type="button" class="stats-arrow wayfinding-arrow" aria-label="Previous stats">${ARROW_LEFT}</button>
      <button type="button" class="stats-arrow wayfinding-arrow" aria-label="Next stats">${ARROW_RIGHT}</button>
    </div>`;
  row.after(way);
  const tabs = way.querySelector('.stats-tabs');
  const [prev, next] = way.querySelectorAll('.stats-arrow');
  const step = () => row.clientWidth + (parseFloat(getComputedStyle(row).columnGap) || 0);
  const sync = () => {
    const overflow = Math.max(0, row.scrollWidth - row.clientWidth);
    const pages = overflow > 1 ? 1 + Math.ceil(overflow / step()) : 1;
    way.hidden = pages < 2;
    if (tabs.children.length !== pages) {
      tabs.replaceChildren(...Array.from({ length: pages }, (_, i) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'stats-tab wayfinding-tab';
        tab.setAttribute('aria-label', `Go to stats page ${i + 1}`);
        tab.addEventListener('click', () => row.scrollTo({ left: i * step() }));
        return tab;
      }));
    }
    // the last page clamps to max scroll (shorter than a full step)
    const active = overflow > 1 && row.scrollLeft >= overflow - 1
      ? pages - 1
      : Math.min(pages - 1, Math.round(row.scrollLeft / step()));
    [...tabs.children].forEach((t, i) => t.classList.toggle('active', i === active));
  };
  prev.addEventListener('click', () => row.scrollBy({ left: -step() }));
  next.addEventListener('click', () => row.scrollBy({ left: step() }));
  row.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  new ResizeObserver(sync).observe(row);
  sync();
}

export default function decorate(block) {
  const banner = block.classList.contains('banner');
  const statCells = [];
  let header = null;
  let background = null;
  [...block.children].forEach((row) => {
    if (row.querySelector('h1, h2, h3, h4')) {
      row.classList.add('stats-header');
      header = row;
      return;
    }
    if (banner && row.querySelector('picture') && !row.textContent.trim()) {
      background = row.querySelector('picture');
      row.remove();
      return;
    }
    if (row.querySelector('a')) {
      row.classList.add('stats-cta');
      return;
    }
    if (row.querySelector('strong')) {
      [...row.children].forEach((cell) => {
        decorateStat(cell);
        statCells.push(cell);
      });
      row.remove();
      return;
    }
    if (!row.textContent.trim()) row.remove();
  });

  const row = document.createElement('div');
  row.className = 'stats-row';
  row.append(...statCells);
  if (header) header.after(row);
  else block.prepend(row);

  if (background) {
    background.classList.add('stats-background');
    block.prepend(background);
  }

  if (!banner && !block.classList.contains('stack')) setupCarousel(block, row);
  setupCountUp(block);
}

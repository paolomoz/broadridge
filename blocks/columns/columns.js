/* columns — Figma web kit M3 Alternating Content Blocks (set 504:57165)
   and C5 Two Column Text Feature (set 617:61637, variant
   `columns (text-feature)`).
   M3 rows are authored media/content cell pairs: media position comes
   from the authored cell order (media cell first = Media Position Left,
   504:57156; second = Right, 714:412998); `columns (stack)` maps the
   Stack Bottom variants (714:437234 / 714:434195). At mobile the kit
   defines Stack Top only (714:422898): media always renders first.
   A media cell with several pictures becomes the kit carousel with the
   A22 wayfinder row (`showCarousel` boolean on 504:57156); a leading
   picture in the content cell is the kit Logo boolean (2782:339361). */

const ARROW_LEFT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.86595 8.47797C2.60089 8.21821 2.60135 7.7932 2.8607 7.53403V7.52737L6.85777 3.53305C7.11758 3.26676 7.53727 3.26676 7.80375 3.53305C8.06356 3.79268 8.06356 4.21208 7.80375 4.47837L4.93916 7.34099H12.6672C13.0336 7.34099 13.3333 7.6339 13.3333 8.00671C13.3333 8.37285 13.0336 8.67243 12.6672 8.67243H4.95248L7.80963 11.5276C8.06944 11.7806 8.06944 12.2067 7.80963 12.4663H7.80297C7.6764 12.5861 7.50319 12.6593 7.32999 12.6593L7.33731 12.6667C7.15745 12.6667 6.98424 12.5934 6.86433 12.4736L2.86725 8.47928C2.86682 8.47885 2.86638 8.47841 2.86595 8.47797Z" fill="currentColor"/>
</svg>`;

const ARROW_RIGHT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0537 7.33721L8.19357 4.47924C7.92691 4.21277 7.92691 3.79308 8.19291 3.53327C8.45291 3.2668 8.87291 3.2668 9.13957 3.5326L13.1396 7.52964C13.3069 7.69252 13.3665 7.92711 13.3185 8.1429C13.2843 8.302 13.1927 8.44047 13.0666 8.53545L9.13303 12.4661C9.00636 12.5861 8.83303 12.6593 8.6597 12.6593L8.66636 12.6667C8.48636 12.6667 8.31303 12.5934 8.19303 12.4735C7.92636 12.2137 7.92636 11.7873 8.18636 11.5275V11.5208L11.0398 8.66955H3.33333C2.96 8.66955 2.66667 8.36978 2.66667 8.00338C2.66667 7.63032 2.96 7.33721 3.33333 7.33721H11.0537Z" fill="currentColor"/>
</svg>`;

/* A5 Link CTA (354:1603): a paragraph whose only content is a plain
   link (decorateButtons leaves it alone — no strong/em) */
function markLinkCtas(scope) {
  scope.querySelectorAll('p > a[href]:only-child').forEach((a) => {
    const p = a.parentElement;
    if (p.textContent.trim() === a.textContent.trim() && !a.classList.contains('button')) {
      p.classList.add('columns-cta');
      p.querySelectorAll('a').forEach((a) => a.classList.add('cta-link'));
    }
  });
}

/* A22 wayfinder (2031:71971): tabs left, arrow pair right; one tab per
   slide, page step = one full-width slide */
function setupCarousel(col, mount) {
  const pics = [...col.querySelectorAll('picture')];
  if (pics.length < 2) return;
  const scroller = document.createElement('div');
  scroller.className = 'columns-media';
  pics.forEach((pic) => {
    const slide = document.createElement('div');
    slide.className = 'columns-slide';
    slide.append(pic);
    scroller.append(slide);
  });
  col.replaceChildren(scroller);

  const way = document.createElement('div');
  way.className = 'columns-wayfinding wayfinding';
  way.innerHTML = `<div class="columns-tabs wayfinding-tabs"></div>
    <div class="columns-arrows wayfinding-arrows">
      <button type="button" class="columns-arrow wayfinding-arrow" aria-label="Previous slide">${ARROW_LEFT}</button>
      <button type="button" class="columns-arrow wayfinding-arrow" aria-label="Next slide">${ARROW_RIGHT}</button>
    </div>`;
  const tabs = way.querySelector('.columns-tabs');
  const [prev, next] = way.querySelectorAll('.columns-arrow');
  tabs.replaceChildren(...pics.map((_, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'columns-tab wayfinding-tab';
    tab.setAttribute('aria-label', `Go to slide ${i + 1}`);
    tab.addEventListener('click', () => scroller.scrollTo({ left: i * scroller.clientWidth }));
    return tab;
  }));
  const sync = () => {
    const w = scroller.clientWidth;
    const active = w ? Math.min(pics.length - 1, Math.round(scroller.scrollLeft / w)) : 0;
    [...tabs.children].forEach((t, i) => t.classList.toggle('active', i === active));
  };
  prev.addEventListener('click', () => scroller.scrollBy({ left: -scroller.clientWidth }));
  next.addEventListener('click', () => scroller.scrollBy({ left: scroller.clientWidth }));
  scroller.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  new ResizeObserver(sync).observe(scroller);
  sync();
  mount.append(way);
}

/* C5: the features cell splits into items at each heading; a 1.5px
   A10 divider separates consecutive items (CSS border) */
function decorateTextFeature(block) {
  [...block.children].forEach((row) => {
    const [intro, features] = [...row.children];
    if (intro) intro.classList.add('columns-intro');
    if (!features) return;
    features.classList.add('columns-features');
    const items = [];
    [...features.children].forEach((el) => {
      if (/^H[1-6]$/.test(el.tagName) || !items.length) {
        const item = document.createElement('div');
        item.className = 'columns-feature-item';
        items.push(item);
      }
      items[items.length - 1].append(el);
    });
    features.replaceChildren(...items);
  });
  markLinkCtas(block);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (block.classList.contains('text-feature')) {
    decorateTextFeature(block);
    return;
  }

  const stack = block.classList.contains('stack');
  [...block.children].forEach((row) => {
    let content = null;
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic && !col.textContent.trim()) {
        // picture-only cell = A13 media column
        col.classList.add('columns-img-col');
      } else {
        col.classList.add('columns-content-col');
        content = col;
        // kit Logo boolean: a leading picture-only element before the copy
        const first = col.firstElementChild;
        if (first && first.querySelector('picture') && !first.textContent.trim() && first.nextElementSibling) {
          first.classList.add('columns-logo');
        }
      }
    });
    markLinkCtas(row);
    const media = row.querySelector('.columns-img-col');
    if (media) setupCarousel(media, stack || !content ? row : content);
    // Stack Bottom (714:437234): the CTA renders below the media (and
    // wayfinder), right-aligned at desktop / left at tablet
    if (stack && content) {
      const cta = content.querySelector(':scope > .button-wrapper, :scope > .columns-cta');
      if (cta) {
        cta.classList.add('columns-row-cta');
        row.append(cta);
      }
    }
  });
}

/* carousel — Figma web kit M6 Logo Slider (set 1459:104704, variant
   `carousel (logos)`) and C2 Text Slider (set 616:57326, variant
   `carousel (text)`); the classless block keeps the replica media rail
   (no kit counterpart — divergence register row 5).
   Rows are classified structurally (authors omit/add cells):
   h1/h2 row -> carousel-header, link-only row -> carousel-cta, picture
   cells -> logo tiles, remaining cells -> text tiles.
   Wayfinding = A22 (tabs left + arrow pair right), same interaction
   contract as the gated C4 stats carousel: page step = viewport +
   gutter, tab count from real overflow, hidden when nothing overflows.
   C2 states (spec boards 2190:627168 / 2190:627177): >3 blocks -> the
   slider activates; <=3 blocks fill the row evenly (`fill`) and stack
   at mobile. Slider motion: CSS smooth scrolling under
   prefers-reduced-motion: no-preference (derived — no documented M6/C2
   timing; mirrors the gated C4 pattern). */

const ARROW_LEFT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.86595 8.47797C2.60089 8.21821 2.60135 7.7932 2.8607 7.53403V7.52737L6.85777 3.53305C7.11758 3.26676 7.53727 3.26676 7.80375 3.53305C8.06356 3.79268 8.06356 4.21208 7.80375 4.47837L4.93916 7.34099H12.6672C13.0336 7.34099 13.3333 7.6339 13.3333 8.00671C13.3333 8.37285 13.0336 8.67243 12.6672 8.67243H4.95248L7.80963 11.5276C8.06944 11.7806 8.06944 12.2067 7.80963 12.4663H7.80297C7.6764 12.5861 7.50319 12.6593 7.32999 12.6593L7.33731 12.6667C7.15745 12.6667 6.98424 12.5934 6.86433 12.4736L2.86725 8.47928C2.86682 8.47885 2.86638 8.47841 2.86595 8.47797Z" fill="currentColor"/>
</svg>`;

const ARROW_RIGHT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0537 7.33721L8.19357 4.47924C7.92691 4.21277 7.92691 3.79308 8.19291 3.53327C8.45291 3.2668 8.87291 3.2668 9.13957 3.5326L13.1396 7.52964C13.3069 7.69252 13.3665 7.92711 13.3185 8.1429C13.2843 8.302 13.1927 8.44047 13.0666 8.53545L9.13303 12.4661C9.00636 12.5861 8.83303 12.6593 8.6597 12.6593L8.66636 12.6667C8.48636 12.6667 8.31303 12.5934 8.19303 12.4735C7.92636 12.2137 7.92636 11.7873 8.18636 11.5275V11.5208L11.0398 8.66955H3.33333C2.96 8.66955 2.66667 8.36978 2.66667 8.00338C2.66667 7.63032 2.96 7.33721 3.33333 7.33721H11.0537Z" fill="currentColor"/>
</svg>`;

/* A22 wayfinder row: tabs left + arrow pair right, shown only when the
   rail overflows (same runtime as the gated C4/M3 wayfinders) */
function setupWayfinding(block, row) {
  const way = document.createElement('div');
  way.className = 'carousel-wayfinding wayfinding';
  way.innerHTML = `<div class="carousel-tabs wayfinding-tabs"></div>
    <div class="carousel-arrows wayfinding-arrows">
      <button type="button" class="carousel-arrow wayfinding-arrow" aria-label="Previous slides">${ARROW_LEFT}</button>
      <button type="button" class="carousel-arrow wayfinding-arrow" aria-label="Next slides">${ARROW_RIGHT}</button>
    </div>`;
  row.after(way);
  const tabs = way.querySelector('.carousel-tabs');
  const [prev, next] = way.querySelectorAll('.carousel-arrow');
  const step = () => row.clientWidth + (parseFloat(getComputedStyle(row).columnGap) || 0);
  const sync = () => {
    const overflow = Math.max(0, row.scrollWidth - row.clientWidth);
    const pages = overflow > 1 ? 1 + Math.ceil(overflow / step()) : 1;
    way.hidden = pages < 2;
    if (tabs.children.length !== pages) {
      tabs.replaceChildren(...Array.from({ length: pages }, (_, i) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'carousel-tab wayfinding-tab';
        tab.setAttribute('aria-label', `Go to slide page ${i + 1}`);
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

/* header/cta/item row classification shared by both kit variants */
function classifyRows(block) {
  let header = null;
  const itemCells = [];
  [...block.children].forEach((row) => {
    if (!header && row.querySelector('h1, h2')) {
      row.classList.add('carousel-header');
      header = row;
      return;
    }
    // CTA row: a lone link and nothing else (A5 Button Group)
    const link = row.querySelector('a');
    if (link && link.textContent.trim() === row.textContent.trim() && !row.querySelector('picture')) {
      row.classList.add('carousel-cta');
      return;
    }
    if (!row.textContent.trim() && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    [...row.children].forEach((cell) => itemCells.push(cell));
    row.remove();
  });
  return { header, itemCells };
}

/* M6 tile: white bordered card centering the logo; trailing text (the
   kit's hidden Description boolean 1722:16361) becomes the caption */
function buildLogoItem(cell) {
  const item = document.createElement('div');
  item.className = 'carousel-item';
  const card = document.createElement('div');
  card.className = 'carousel-logo';
  const picture = cell.querySelector('picture, img');
  if (picture) card.append(picture);
  item.append(card);
  cell.querySelectorAll('p, div').forEach((p) => {
    if (p.textContent.trim() && !p.querySelector('picture, img')) {
      p.classList.add('carousel-caption');
      item.append(p);
    }
  });
  return item;
}

/* C2 tile: headline + body behind the 1.5px border/base rule; a
   trailing lone-link p renders as the A5 arrow link (usage boards
   2190:628117 show it on stacked mobile tiles) */
function buildTextItem(cell) {
  cell.classList.add('carousel-item');
  const ps = cell.querySelectorAll('p');
  const last = ps[ps.length - 1];
  if (last) {
    const a = last.querySelector('a');
    if (a && a.textContent.trim() === last.textContent.trim()) last.classList.add('carousel-item-cta');
  }
  return cell;
}

export default function decorate(block) {
  const logos = block.classList.contains('logos');
  const text = block.classList.contains('text');

  if (!logos && !text) {
    // generic media rail (replica; kept for existing pages)
    const ul = document.createElement('ul');
    [...block.children].forEach((row) => {
      const li = document.createElement('li');
      while (row.firstElementChild) li.append(row.firstElementChild);
      ul.append(li);
    });
    block.replaceChildren(ul);
    return;
  }

  const { header, itemCells } = classifyRows(block);
  const row = document.createElement('div');
  row.className = 'carousel-row';
  row.append(...itemCells.map((cell) => (logos ? buildLogoItem(cell) : buildTextItem(cell))));
  if (header) header.after(row);
  else block.prepend(row);

  if (logos) {
    // mobile 2-row grid, filled row-major over ceil(n/2) columns
    // (1459:104756: logos 1-3 top row, 4-5 second row)
    block.style.setProperty('--carousel-logo-columns', Math.ceil(row.children.length / 2));
  }
  if (text && row.children.length <= 3) {
    // <=3 blocks: fill evenly, stack at mobile (2190:627177 min/mid states)
    block.classList.add('fill');
  }

  setupWayfinding(block, row);
}

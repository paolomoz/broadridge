/* cards — Figma web kit C1A Card Grid (set 1723:60801) + C1B Card Grid
   (set 6520:29954), and M4 Featured Cards (set 5618:13809, variant
   `cards (featured)`). Shared card unit: A7 Cards /Bento, Content
   Align=Distribute, Padding=24 (552:8222); M4 card unit is
   .M4 Featured Cards / Core (5618:13833).
   Rows are classified structurally (authors may omit header/CTA):
   h1/h2 row -> cards-header, link-only row -> cards-cta, remaining
   rows -> card tiles. Tile count is content-driven:
   - <=4 tiles (kit C1A axis No.ofTiles=4) -> `showcase` composition:
     header above the grid, wayfinding row (2293:81834), module gap 48
     at desktop.
   - >=5 tiles (kit C1B axis No.ofTiles=6) -> no wayfinding, 32px
     rhythm; a heading-only header joins the grid, spanning two columns
     at desktop (6520:29989).
   Wayfinding tabs are one per card (kit shows 4 tabs for 4 tiles,
   2293:81835); tab/arrow interaction (scroll the card into view) is
   derived — the kit ships no C1A prototype board. */

import { createOptimizedPicture } from '../../scripts/aem.js';

/* A22 Wayfinder arrows (142:5881), 16px, currentColor */
const ARROW_LEFT_16 = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.86595 8.47797C2.60089 8.21821 2.60135 7.7932 2.8607 7.53403V7.52737L6.85777 3.53305C7.11758 3.26676 7.53727 3.26676 7.80375 3.53305C8.06356 3.79268 8.06356 4.21208 7.80375 4.47837L4.93916 7.34099H12.6672C13.0336 7.34099 13.3333 7.6339 13.3333 8.00671C13.3333 8.37285 13.0336 8.67243 12.6672 8.67243H4.95248L7.80963 11.5276C8.06944 11.7806 8.06944 12.2067 7.80963 12.4663H7.80297C7.6764 12.5861 7.50319 12.6593 7.32999 12.6593L7.33731 12.6667C7.15745 12.6667 6.98424 12.5934 6.86433 12.4736L2.86725 8.47928C2.86682 8.47885 2.86638 8.47841 2.86595 8.47797Z" fill="currentColor"/>
</svg>`;

const ARROW_RIGHT_16 = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0537 7.33721L8.19357 4.47924C7.92691 4.21277 7.92691 3.79308 8.19291 3.53327C8.45291 3.2668 8.87291 3.2668 9.13957 3.5326L13.1396 7.52964C13.3069 7.69252 13.3665 7.92711 13.3185 8.1429C13.2843 8.302 13.1927 8.44047 13.0666 8.53545L9.13303 12.4661C9.00636 12.5861 8.83303 12.6593 8.6597 12.6593L8.66636 12.6667C8.48636 12.6667 8.31303 12.5934 8.19303 12.4735C7.92636 12.2137 7.92636 11.7873 8.18636 11.5275V11.5208L11.0398 8.66955H3.33333C2.96 8.66955 2.66667 8.36978 2.66667 8.00338C2.66667 7.63032 2.96 7.33721 3.33333 7.33721H11.0537Z" fill="currentColor"/>
</svg>`;

/* card Link CTA arrow — Arrows / Arrow Right 24px (24:702), currentColor */
const CARD_ARROW_24 = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12.2891 5.29978C12.679 4.90015 13.309 4.90032 13.709 5.2988L19.709 11.2949C19.9553 11.5347 20.0453 11.8776 19.9805 12.1963C19.9328 12.4394 19.7956 12.65 19.6055 12.7959L13.6992 18.6992C13.5092 18.879 13.2492 18.9892 12.9893 18.9892L13 19C12.73 19 12.4691 18.8898 12.2891 18.7099C11.8894 18.3202 11.8894 17.6806 12.2793 17.291V17.2812L16.5605 13.0039H5C4.44 13.0039 4 12.5545 4 12.0049C4.0001 11.4454 4.44006 11.0058 5 11.0058H16.5801L12.29 6.71872C11.8903 6.31904 11.8902 5.68943 12.2891 5.29978Z" fill="currentColor"/>
</svg>`;

/* A7/M4 card anatomy: image cell (featured only), body with copy +
   icon-only Link CTA (354:1603) — the authored link text stays for
   assistive tech, the visible affordance is the 24px arrow */
function decorateCard(li) {
  [...li.children].forEach((div) => {
    if (div.children.length === 1 && div.querySelector('picture, img')) div.className = 'cards-card-image';
    else div.className = 'cards-card-body';
  });
  const link = li.querySelector('.cards-card-body a');
  if (link) {
    const wrapper = link.closest('p') || link.parentElement;
    wrapper.classList.remove('button-wrapper');
    wrapper.classList.add('cards-card-cta');
    link.classList.remove('button', 'primary', 'secondary');
    const label = link.textContent.trim() || 'Read more';
    link.innerHTML = `<span class="cards-link-label">${label}</span>${CARD_ARROW_24}`;
  }
}

/* C1A wayfinding row (2293:81834): A22 tabs left (one per card, first
   active) + arrow pair right; tabs/arrows bring cards into view */
function buildWayfinding(ul) {
  const way = document.createElement('div');
  way.className = 'cards-wayfinding';
  way.innerHTML = `<div class="cards-tabs"></div>
    <div class="cards-arrows">
      <button type="button" class="cards-arrow" aria-label="Previous card">${ARROW_LEFT_16}</button>
      <button type="button" class="cards-arrow" aria-label="Next card">${ARROW_RIGHT_16}</button>
    </div>`;
  const tabs = way.querySelector('.cards-tabs');
  const items = [...ul.children];
  let active = 0;
  const goTo = (i) => {
    active = Math.max(0, Math.min(items.length - 1, i));
    items[active].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    [...tabs.children].forEach((t, k) => t.classList.toggle('active', k === active));
  };
  tabs.replaceChildren(...items.map((_, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `cards-tab${i === 0 ? ' active' : ''}`;
    tab.setAttribute('aria-label', `Go to card ${i + 1}`);
    tab.addEventListener('click', () => goTo(i));
    return tab;
  }));
  const [prev, next] = way.querySelectorAll('.cards-arrow');
  prev.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  return way;
}

export default function decorate(block) {
  const featured = block.classList.contains('featured');
  let header = null;
  let cta = null;
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!header && row.querySelector('h1, h2')) {
      header = row;
      row.classList.add('cards-header');
      return;
    }
    const link = row.querySelector('a');
    if (link && row.textContent.trim() === link.textContent.trim()) {
      cta = row;
      row.classList.add('cards-cta');
      return;
    }
    if (!row.textContent.trim() && !row.querySelector('picture, img')) {
      row.remove();
      return;
    }
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCard(li);
    ul.append(li);
    row.remove();
  });

  // only same-origin images go through the media-bus optimizer; migrated
  // content references the source CDN until media is rehosted
  ul.querySelectorAll('picture > img').forEach((img) => {
    if (new URL(img.src, window.location.href).origin === window.location.origin) {
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    }
  });

  const count = ul.children.length;
  let way = null;
  if (!featured) {
    if (count <= 4) {
      // C1A composition (No.ofTiles=4): wayfinding + 48px desktop rhythm
      block.classList.add('showcase');
      way = buildWayfinding(ul);
    } else if (header && !header.querySelector('p')) {
      // C1B composition (No.ofTiles=6): heading-only header joins the grid
      block.classList.add('inline-header');
      const li = document.createElement('li');
      li.className = 'cards-header-tile';
      li.append(header);
      ul.prepend(li);
    }
  }

  block.replaceChildren();
  if (header && !block.classList.contains('inline-header')) block.append(header);
  block.append(ul);
  if (way) block.append(way);
  if (cta) block.append(cta);
}

/*
 * insights — curated cards stay 1:1 with source; when a card links to an
 * indexed page, title/image are enriched from the query-index (Tier-1 data).
 *
 * Surface: Figma web kit M5 Insights (set 492:55962), axes Device x
 * Card Amount (4 Cards / 2 Cards). Card unit: A7 Cards / Default
 * (I800:438184) — A13 Media 3:2 band over a fixed 280px content band
 * (badge + Title-2 [+ Body-3] + icon-only Link CTA pinned to the foot).
 * Composition from authored card count (kit axis Card Amount):
 * - <=2 cards -> `duo` (808:83953): 2-up grid, no wayfinding.
 * - 3 cards -> `trio` (usage board 2190:649869, derived): 3-up grid at
 *   desktop without wayfinding; tablet/mobile behave as the 4-card rail.
 * - >=4 cards -> default (800:438181): desktop 4-col grid + wayfinding;
 *   tablet/mobile are a clipped horizontal rail of fixed 272px cards
 *   (800:447981 / 808:75747) driven by the A22 wayfinder.
 */

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

/* Tier-1 enrichment — behavior unchanged: best-effort fetch of the
   query-index; when a curated card links to an indexed page and carries
   no image, the index image is added as the card's A13 media band. */
async function enrich(block) {
  try {
    const resp = await fetch('/query-index.json?limit=3000');
    if (!resp.ok) return;
    const { data } = await resp.json();
    const byPath = new Map(data.map((r) => [r.path, r]));
    block.querySelectorAll('.insights-card h3 a[href^="/"]').forEach((a) => {
      const rec = byPath.get(new URL(a.href, window.location).pathname);
      if (!rec) return;
      const card = a.closest('.insights-card');
      if (card && !card.querySelector('img') && rec.image && !rec.image.endsWith('/default-meta-image.png')) {
        const img = document.createElement('img');
        img.src = rec.image;
        img.alt = '';
        img.loading = 'lazy';
        const media = document.createElement('div');
        media.className = 'insights-card-image';
        media.append(img);
        card.prepend(media);
      }
    });
  } catch (e) {
    // enrichment is best-effort; curated content already renders
  }
}

/* A7 Cards / Default anatomy (I800:438184): media band, then content
   band with badge (A2), Title-2 [+ Body-3], icon-only Link CTA */
function decorateCard(row) {
  row.classList.add('insights-card');
  const media = document.createElement('div');
  media.className = 'insights-card-image';
  const body = document.createElement('div');
  body.className = 'insights-card-body';
  [...row.children].forEach((cell) => {
    while (cell.firstChild) {
      const el = cell.firstChild;
      const isMedia = el.nodeType === 1 && (el.matches('picture, img')
        || (el.matches('p') && !el.textContent.trim() && el.querySelector('picture, img')));
      if (isMedia) media.append(el.matches('p') ? el.querySelector('picture, img') : el);
      else body.append(el);
      if (el.parentNode === cell) cell.removeChild(el); // empty p husk
    }
    cell.remove();
  });
  // content-type em is the A2 Badge atom (I800:438184;553:33446;304:1875)
  body.querySelectorAll('em').forEach((em) => em.classList.add('badge'));
  // icon-only Link CTA (354:1603): visible affordance mirrors the title
  // link; decorative for AT (the h3 link is the accessible control)
  const titleLink = body.querySelector('h3 a[href]');
  const cta = document.createElement(titleLink ? 'a' : 'span');
  cta.className = 'insights-card-cta';
  cta.setAttribute('aria-hidden', 'true');
  if (titleLink) {
    cta.setAttribute('href', titleLink.getAttribute('href'));
    cta.tabIndex = -1;
  }
  cta.innerHTML = CARD_ARROW_24;
  body.append(cta);
  if (media.hasChildNodes()) row.prepend(media);
  row.append(body);
}

/* wayfinding row (1612:29277): A22 tabs left (one per card, first
   active) + arrow pair right; tabs/arrows bring cards into view */
function buildWayfinding(rail) {
  const way = document.createElement('div');
  way.className = 'insights-wayfinding';
  way.innerHTML = `<div class="insights-tabs"></div>
    <div class="insights-arrows">
      <button type="button" class="insights-arrow" aria-label="Previous card">${ARROW_LEFT_16}</button>
      <button type="button" class="insights-arrow" aria-label="Next card">${ARROW_RIGHT_16}</button>
    </div>`;
  const tabs = way.querySelector('.insights-tabs');
  const items = [...rail.children];
  let active = 0;
  const goTo = (i) => {
    active = Math.max(0, Math.min(items.length - 1, i));
    items[active].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    [...tabs.children].forEach((t, k) => t.classList.toggle('active', k === active));
  };
  tabs.replaceChildren(...items.map((_, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `insights-tab${i === 0 ? ' active' : ''}`;
    tab.setAttribute('aria-label', `Go to card ${i + 1}`);
    tab.addEventListener('click', () => goTo(i));
    return tab;
  }));
  const [prev, next] = way.querySelectorAll('.insights-arrow');
  prev.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  return way;
}

export default function decorate(block) {
  let header = null;
  let cta = null;
  const rail = document.createElement('div');
  rail.className = 'insights-rail';

  [...block.children].forEach((row) => {
    if (!header && row.querySelector('h1, h2')) {
      header = row;
      row.classList.add('insights-header');
      return;
    }
    const link = row.querySelector('a');
    if (link && !row.querySelector('h3') && row.textContent.trim() === link.textContent.trim()) {
      cta = row;
      row.classList.add('insights-cta');
      return;
    }
    if (!row.textContent.trim() && !row.querySelector('picture, img')) {
      row.remove();
      return;
    }
    decorateCard(row);
    rail.append(row);
  });

  // Card Amount composition from authored count (kit axis 4/2; 3-card
  // mid state from usage board 2190:649869 — derived, see tolerances)
  const count = rail.children.length;
  let way = null;
  if (count <= 2) block.classList.add('duo');
  else {
    if (count === 3) block.classList.add('trio');
    way = buildWayfinding(rail);
  }

  block.replaceChildren();
  if (header) block.append(header);
  block.append(rail);
  if (way) block.append(way);
  if (cta) block.append(cta);

  block.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
  enrich(block);
}

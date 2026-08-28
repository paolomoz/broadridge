/* infographic — Figma web kit M12 Infographic (set 2742:441526, page
   2705:199080; single axis: Device). A large media figure (A13, 16:9,
   radius 4) under an A9 header, with an optional source attribution
   row (the kit's Section Source boolean layer) and an optional A22
   wayfinder (boolean, hidden in every kit variant).

   AUTHORING CONTRACT (rows classified structurally, order-tolerant):
   - heading row (contains h1-h3, optionally intro paragraphs in the
     same cell) -> infographic-header content (A9 Content Groups:
     title Heading-2, intro Body-1 Book, kit 2738:70232);
   - lone-link row -> primary CTA (a.button; right of the copy and
     bottom-aligned at desktop, below the copy right-aligned at
     tablet, full-width at mobile — A9 CTA Right / A5 Stack Full
     Width variants);
   - picture cell(s) -> figures (A13 Media). ONE figure renders
     inline (kit default: Wayfinder boolean false); MULTIPLE figures
     form a horizontal rail and the A22 wayfinder appears (tabs left,
     arrow pair right — same interaction contract as the gated
     C4/M3/M6 wayfinders: page step = viewport + gutter, tab count
     from real overflow, hidden when nothing overflows);
   - any other non-empty text row -> source attribution
     (infographic-source, Section Source 2738:70239: 14px/1.4
     content/secondary; authors bold the "Source:" prefix). */

const ARROW_LEFT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.86595 8.47797C2.60089 8.21821 2.60135 7.7932 2.8607 7.53403V7.52737L6.85777 3.53305C7.11758 3.26676 7.53727 3.26676 7.80375 3.53305C8.06356 3.79268 8.06356 4.21208 7.80375 4.47837L4.93916 7.34099H12.6672C13.0336 7.34099 13.3333 7.6339 13.3333 8.00671C13.3333 8.37285 13.0336 8.67243 12.6672 8.67243H4.95248L7.80963 11.5276C8.06944 11.7806 8.06944 12.2067 7.80963 12.4663H7.80297C7.6764 12.5861 7.50319 12.6593 7.32999 12.6593L7.33731 12.6667C7.15745 12.6667 6.98424 12.5934 6.86433 12.4736L2.86725 8.47928C2.86682 8.47885 2.86638 8.47841 2.86595 8.47797Z" fill="currentColor"/>
</svg>`;

const ARROW_RIGHT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0537 7.33721L8.19357 4.47924C7.92691 4.21277 7.92691 3.79308 8.19291 3.53327C8.45291 3.2668 8.87291 3.2668 9.13957 3.5326L13.1396 7.52964C13.3069 7.69252 13.3665 7.92711 13.3185 8.1429C13.2843 8.302 13.1927 8.44047 13.0666 8.53545L9.13303 12.4661C9.00636 12.5861 8.83303 12.6593 8.6597 12.6593L8.66636 12.6667C8.48636 12.6667 8.31303 12.5934 8.19303 12.4735C7.92636 12.2137 7.92636 11.7873 8.18636 11.5275V11.5208L11.0398 8.66955H3.33333C2.96 8.66955 2.66667 8.36978 2.66667 8.00338C2.66667 7.63032 2.96 7.33721 3.33333 7.33721H11.0537Z" fill="currentColor"/>
</svg>`;

/* A22 wayfinder (2738:70236, boolean layer): tabs left + arrow pair
   right on the shared .wayfinding-* classes; shown only when the rail
   overflows — same runtime as the gated C4/M3/M6 wayfinders */
function setupWayfinding(row) {
  const way = document.createElement('div');
  way.className = 'infographic-wayfinding wayfinding';
  way.innerHTML = `<div class="wayfinding-tabs"></div>
    <div class="wayfinding-arrows">
      <button type="button" class="wayfinding-arrow" aria-label="Previous figure">${ARROW_LEFT}</button>
      <button type="button" class="wayfinding-arrow" aria-label="Next figure">${ARROW_RIGHT}</button>
    </div>`;
  row.after(way);
  const tabs = way.querySelector('.wayfinding-tabs');
  const [prev, next] = way.querySelectorAll('.wayfinding-arrow');
  const step = () => row.clientWidth + (parseFloat(getComputedStyle(row).columnGap) || 0);
  const sync = () => {
    const overflow = Math.max(0, row.scrollWidth - row.clientWidth);
    const pages = overflow > 1 ? 1 + Math.ceil(overflow / step()) : 1;
    way.hidden = pages < 2;
    if (tabs.children.length !== pages) {
      tabs.replaceChildren(...Array.from({ length: pages }, (_, i) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'wayfinding-tab';
        tab.setAttribute('aria-label', `Go to figure ${i + 1}`);
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
  let content = null;
  let cta = null;
  const figureCells = [];
  const sourceParts = [];

  [...block.children].forEach((row) => {
    if (!content && row.querySelector('h1, h2, h3')) {
      row.classList.add('infographic-content');
      content = row;
      return;
    }
    const link = row.querySelector('a');
    if (!cta && link && link.textContent.trim() === row.textContent.trim()
      && !row.querySelector('picture')) {
      row.classList.add('infographic-cta');
      cta = row;
      return;
    }
    if (row.querySelector('picture')) {
      [...row.children].forEach((cell) => {
        if (cell.querySelector('picture')) figureCells.push(cell);
      });
      row.remove();
      return;
    }
    if (row.textContent.trim()) {
      row.classList.add('infographic-source');
      sourceParts.push(row);
      return;
    }
    row.remove();
  });

  // A9 header: content (+ CTA when authored) in one flex frame
  const header = document.createElement('div');
  header.className = 'infographic-header';
  if (content) header.append(content);
  if (cta) header.append(cta);
  // A13 figures rail
  const row = document.createElement('div');
  row.className = 'infographic-row';
  row.append(...figureCells.map((cell) => {
    const item = document.createElement('div');
    item.className = 'infographic-item';
    while (cell.firstChild) item.append(cell.firstChild);
    return item;
  }));
  block.prepend(row);
  if (header.children.length) block.prepend(header);

  // Section Source rows stay after the rail (and after the wayfinder)
  sourceParts.forEach((p) => block.append(p));

  setupWayfinding(row);
}

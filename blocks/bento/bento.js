/* bento — Figma web kit M1 Bento Grid (set 2315:132824; internal core set
   2315:128939, axes Device x Style; tile unit A7 Cards /Bento 552:7995).

   AUTHORING CONTRACT
   ------------------
   Each block row is ONE unit, classified by content (never by position):
   - header row: contains an h1/h2 (A9 Content Groups 2315:133303).
   - CTA row: contains a link but no h3 and no image (A5 group 2315:135135);
     primary button, right-aligned at desktop / left at tablet / full width
     at mobile, exactly as the kit variants place it.
   - every other row is a TILE. Tile cells (any split, or one cell):
     picture -> media tile backdrop; optional :icon: span; a leading
     link-less paragraph -> A2 badge; h3 -> tile title; further paragraphs
     -> supporting text; a paragraph with a link -> the 24px arrow CTA
     (label kept for a11y).
   - a tile whose h3 is wrapped in <em> is the kit's highlight (inverse
     surface) card override (usage 2315:136110 first card).
   - the media tile (the one with a picture) is placed first, as in every
     kit composition; its text sits in the bottom strip (A9 552:8403).

   TILE SIZING (kit-documented arrangements, by tile count/order):
   - media + 4 cards  -> media 2x2-span, cards single (set default
     2315:132795: 576x580 + four 272x274).
   - media + 2 cards  -> both cards span 2 columns (wide 576x274; usage
     2315:134865 / 2315:136112, core secondTop/Bottom=false).
   - media + 3 cards  -> pair + trailing wide (right core of 2315:136110).
   - 6 cards (`bento (cards)`) -> first and last wide (usage 2315:136110 /
     2315:136337).
   - 8 cards -> all single, 4x2 (core Style=Cards default 2315:128751 x2).
   - 4 cards -> all wide (both core booleans off; derived from the core
     model, no usage board).
   Other counts fall back to single-span flow with a trailing odd card
   widened (recorded as derived in the gate tolerances).

   Variant: `bento (cards)` = Style=Cards (no media tile expected; a media
   tile still renders if authored, tiles only carry the cards arrangement). */

function classifyRows(block) {
  const tiles = [];
  let header = null;
  let cta = null;
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) {
      row.remove();
      return;
    }
    if (row.querySelector('h1, h2')) {
      row.classList.add('bento-header');
      header = row;
      return;
    }
    if (row.querySelector('a') && !row.querySelector('h3, h4, picture, img')) {
      row.classList.add('bento-cta');
      cta = row;
      return;
    }
    row.classList.add('bento-tile');
    tiles.push(row);
  });
  return { header, cta, tiles };
}

function decorateTile(tile) {
  // flatten cells: tile content lays out as one kit column regardless of
  // how the author split the cells
  const cells = [...tile.children];
  cells.forEach((cell) => {
    tile.append(...cell.childNodes);
    cell.remove();
  });

  // wrapTextNodes wraps picture-led content in a <p> — unwrap
  tile.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('picture')) p.replaceWith(...p.childNodes);
  });

  // highlight override: <em> around the tile title (usage 2315:136110)
  const h3 = tile.querySelector('h3, h4');
  const em = h3 && h3.querySelector(':scope > em');
  if (em && em.textContent.trim() === h3.textContent.trim()) {
    em.replaceWith(...em.childNodes);
    tile.classList.add('highlight');
  }

  let badged = false;
  [...tile.querySelectorAll('p')].forEach((p) => {
    if (p.querySelector('a')) {
      p.classList.add('bento-tile-link');
    } else if (!badged && h3
      && (p.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      // leading link-less paragraph before the title = A2 badge
      p.classList.add('bento-badge');
      badged = true;
    } else {
      p.classList.add('bento-text');
    }
  });

  // media tile: picture becomes the backdrop, the rest moves into the strip
  const picture = tile.querySelector('picture');
  if (picture) {
    tile.classList.add('media');
    const strip = document.createElement('div');
    strip.className = 'bento-strip';
    strip.append(...[...tile.childNodes].filter((n) => n !== picture && !n.contains?.(picture)));
    tile.append(strip);
  }
}

/* kit arrangements: which tiles span two columns (see contract above) */
function applySpans(tiles) {
  const media = tiles.find((t) => t.classList.contains('media'));
  const cards = tiles.filter((t) => t !== media);
  const wide = (t) => t.classList.add('wide');
  if (media) {
    if (cards.length === 2) cards.forEach(wide); // 2315:134865
    else if (cards.length === 3) wide(cards[2]); // right core of 2315:136110
    else if (cards.length !== 4 && cards.length % 2) wide(cards[cards.length - 1]);
    return;
  }
  if (cards.length === 6) { wide(cards[0]); wide(cards[5]); } // 2315:136110
  else if (cards.length === 4) cards.forEach(wide); // derived (core booleans)
  else if (cards.length % 2) wide(cards[cards.length - 1]);
}

export default function decorate(block) {
  const { header, tiles } = classifyRows(block);
  tiles.forEach(decorateTile);

  const grid = document.createElement('div');
  grid.className = 'bento-tiles';
  // media first, as in every kit composition
  tiles.sort((a, b) => b.classList.contains('media') - a.classList.contains('media'));
  grid.append(...tiles);
  if (header) header.after(grid);
  else block.prepend(grid);

  applySpans(tiles);
}

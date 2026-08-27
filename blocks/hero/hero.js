export default function decorate(block) {
  const rows = [...block.children];

  // first row with only short link content = breadcrumb (authors may omit it)
  if (rows.length > 1) {
    const first = rows[0];
    const links = first.querySelectorAll('a');
    const text = first.textContent.trim();
    if (links.length && !first.querySelector('h1, h2') && text.length < 120) {
      first.classList.add('hero-breadcrumb');
      const navEl = document.createElement('nav');
      navEl.setAttribute('aria-label', 'breadcrumb');
      navEl.append(...first.querySelector('div').childNodes);
      first.querySelector('div').append(navEl);
    }
  }

  // structural row classes — kit properties allow omitting breadcrumb/CTA,
  // so styling can't rely on row position
  rows.forEach((row) => {
    if (row.classList.contains('hero-breadcrumb')) return;
    if (row.querySelector('h1, h2')) row.classList.add('hero-content');
    else if (row.querySelector('h3')) row.classList.add('hero-tile'); // deconstructed bento tile
    else if (row.querySelector('picture, img')) row.classList.add('hero-media'); // split/feature media
    else if (row.querySelector('a')) row.classList.add('hero-cta');
  });

  // deconstructed (H1 93:21170): group content+CTA into the display card and
  // the h3 tiles into the 421px rail so each side can carry card chrome
  if (block.classList.contains('deconstructed')) {
    const card = document.createElement('div');
    card.className = 'hero-card';
    const content = block.querySelector(':scope > .hero-content');
    if (content) {
      block.insertBefore(card, content);
      // an image-only cell in the content row is the card's facet backdrop
      const bg = [...content.querySelectorAll(':scope > div')]
        .find((cell) => cell.querySelector('picture, img') && !cell.querySelector('h1, h2'));
      if (bg) {
        bg.classList.add('hero-card-bg');
        card.append(bg);
      }
      card.append(content);
      const cta = block.querySelector(':scope > .hero-cta');
      if (cta) card.append(cta);
    }
    const tileRows = [...block.querySelectorAll(':scope > .hero-tile')];
    if (tileRows.length) {
      const tiles = document.createElement('div');
      tiles.className = 'hero-tiles';
      block.append(tiles);
      tileRows.forEach((t) => {
        tiles.append(t);
        // wrapTextNodes wraps picture-led cells in a single <p> — unwrap so
        // the tile cell can lay out as the kit's column
        const wrapper = [...t.querySelectorAll(':scope > div > p')]
          .find((p) => p.querySelector('picture'));
        if (wrapper) wrapper.replaceWith(...wrapper.childNodes);
        // leading linkless paragraph = A2 badge; paragraph with link = arrow CTA
        const ps = [...t.querySelectorAll('p')].filter((p) => !p.querySelector('picture'));
        const badge = ps.find((p) => !p.querySelector('a'));
        if (badge) badge.classList.add('hero-badge');
        const link = ps.find((p) => p.querySelector('a'));
        if (link) link.classList.add('hero-tile-link');
      });
    }
  }
}

/* media-contacts — Figma web kit C6 Media Contacts (set 2403:37488,
   page 2403:22026). Authored cells (any row split) classify by content,
   preserving the migrated author contract (heading-only cells and
   free-form contact cells both occur on real pages):
   - the first cell with an h1-h3 -> module header (A9 Content Groups:
     heading + optional link paragraph(s) -> A5 Link CTA row)
   - every other cell -> one contact (C6 Media Contacts Core):
     - picture/img          -> flag (Card Top Info, right slot)
     - link-less p before the name heading -> A2 badge (Card Top Info)
     - h4-h6 or first link-less p          -> name
     - further link-less ps                -> title / details
     - p with a link -> contact link (mailto -> email icon,
       tel -> phone icon, other -> login icon)
   Core Style axis: Basic = default `media-contacts`;
   Card (2832:89967) = `media-contacts (card)`. */

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  let headerCell = null;
  const contactCells = [];

  cells.forEach((cell) => {
    if (!headerCell && cell.querySelector('h1, h2, h3')) {
      headerCell = cell;
      return;
    }
    contactCells.push(cell);
  });

  const children = [];

  if (headerCell) {
    headerCell.className = 'media-contacts-header';
    const ctas = [...headerCell.querySelectorAll(':scope > p')]
      .filter((p) => p.querySelector('a[href]'));
    if (ctas.length) {
      const ctaRow = document.createElement('div');
      ctaRow.className = 'media-contacts-ctas';
      ctaRow.append(...ctas);
      headerCell.append(ctaRow);
    }
    children.push(headerCell);
  }

  const contacts = [];
  contactCells.forEach((cell) => {
    if (!cell.textContent.trim() && !cell.querySelector('picture, img')) return;
    cell.className = 'media-contacts-contact';

    const flag = cell.querySelector('picture, img');
    let badge = null;
    let name = cell.querySelector('h4, h5, h6');
    const linkPs = [];
    [...cell.querySelectorAll(':scope > p')].forEach((p) => {
      if (p.querySelector('a[href]')) {
        linkPs.push(p);
      } else if (p.querySelector('picture, img')) {
        // picture paragraph: handled via the flag lookup
      } else if (!badge && p.nextElementSibling
        && /^H[4-6]$/.test(p.nextElementSibling.tagName)) {
        badge = p;
      } else if (!name) {
        name = p;
      } else {
        p.classList.add('media-contacts-title');
      }
    });

    if (badge) badge.classList.add('badge');
    if (name) name.classList.add('media-contacts-name');

    if (badge || flag) {
      const top = document.createElement('div');
      top.className = 'media-contacts-top';
      if (badge) top.append(badge);
      if (flag) {
        const wrap = document.createElement('span');
        wrap.className = 'media-contacts-flag';
        const pic = flag.closest('p') || flag;
        wrap.append(flag);
        if (pic !== flag && !pic.textContent.trim()) pic.remove();
        top.append(wrap);
      }
      cell.prepend(top);
    }

    linkPs.forEach((p) => {
      p.classList.add('media-contacts-link');
      const a = p.querySelector('a[href]');
      const href = a.getAttribute('href') || '';
      if (href.startsWith('mailto:')) p.classList.add('email');
      else if (href.startsWith('tel:')) p.classList.add('phone');
    });
    if (linkPs.length) {
      const links = document.createElement('div');
      links.className = 'media-contacts-links';
      links.append(...linkPs);
      cell.append(links);
    }

    contacts.push(cell);
  });

  if (contacts.length) {
    const grid = document.createElement('div');
    grid.className = 'media-contacts-grid';
    grid.append(...contacts);
    children.push(grid);
  }

  block.replaceChildren(...children);
}

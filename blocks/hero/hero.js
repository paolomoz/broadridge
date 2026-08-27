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
    else if (row.querySelector('a')) row.classList.add('hero-cta');
  });
}

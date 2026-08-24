export default function decorate(block) {
  // first row with only links = breadcrumb
  const rows = [...block.children];
  if (rows.length > 1) {
    const first = rows[0];
    const links = first.querySelectorAll('a');
    const text = first.textContent.trim();
    if (links.length && text.length < 120) {
      first.classList.add('hero-breadcrumb');
      const navEl = document.createElement('nav');
      navEl.setAttribute('aria-label', 'breadcrumb');
      navEl.append(...first.querySelector('div').childNodes);
      first.querySelector('div').append(navEl);
    }
  }
}

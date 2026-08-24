/*
 * listing — dynamic feed over the EDS query-index.
 * Variants: press (press releases), insights (articles/insights), all.
 * Filters: ?facet year (press), category (insights) + free-text search box.
 * Locale-scoped: /de and /jp pages read their locale's slice.
 */
const PAGE_SIZE = 20;

function localeOf() {
  const m = window.location.pathname.match(/^\/(de|jp|cit)(\/|$)/);
  return m ? m[1] : 'en';
}

function matchesVariant(rec, variant, loc) {
  const p = rec.path;
  const inLocale = loc === 'en' ? !/^\/(de|jp|cit)\//.test(p) : p.startsWith(`/${loc}/`);
  if (!inLocale) return false;
  if (variant === 'press') return /\/press-release\//.test(p) || /\/announcements\//.test(p);
  if (variant === 'insights') return /\/(insights|article|white-paper|report|case-study|podcast|video|webinar|infographic|ebook|fact-sheet|resource)\//.test(p);
  return true;
}

function card(rec, variant) {
  const li = document.createElement('li');
  li.className = 'listing-item';
  const a = document.createElement('a');
  a.href = rec.path;
  const h3 = document.createElement('h3');
  h3.textContent = rec.title || rec.path;
  a.append(h3);
  if (rec.description) {
    const p = document.createElement('p');
    p.textContent = rec.description;
    a.append(p);
  }
  const meta = document.createElement('p');
  meta.className = 'listing-meta';
  const bits = [];
  if (rec.publishdate) bits.push(rec.publishdate);
  if (variant !== 'press' && rec.category) bits.push(rec.category);
  meta.textContent = bits.join(' · ');
  if (bits.length) a.append(meta);
  li.append(a);
  return li;
}

export default async function decorate(block) {
  const variant = block.classList.contains('press') ? 'press'
    : block.classList.contains('insights') ? 'insights' : 'all';
  const loc = localeOf();
  block.textContent = '';

  const controls = document.createElement('div');
  controls.className = 'listing-controls';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = loc === 'jp' ? '検索' : 'Filter…';
  search.setAttribute('aria-label', 'Filter list');
  const facet = document.createElement('select');
  facet.setAttribute('aria-label', variant === 'press' ? 'Filter by year' : 'Filter by category');
  controls.append(search, facet);

  const list = document.createElement('ul');
  list.className = 'listing-list';
  const more = document.createElement('button');
  more.className = 'button secondary';
  more.textContent = 'Load more';
  block.append(controls, list, more);

  let rows = [];
  try {
    const resp = await fetch('/query-index.json?limit=5000');
    const { data } = await resp.json();
    rows = data.filter((r) => matchesVariant(r, variant, loc));
  } catch (e) {
    more.hidden = true;
    return;
  }
  // sort newest first by publishdate then path (press paths carry the year)
  rows.sort((a, b) => (b.publishdate || b.path).localeCompare(a.publishdate || a.path));

  // facet values
  const facets = new Set();
  rows.forEach((r) => {
    if (variant === 'press') {
      const y = (r.publishdate || '').slice(0, 4) || (r.path.match(/\/press-release\/(\d{4})\//) || [])[1];
      if (y) facets.add(y);
    } else if (r.category) facets.add(r.category);
  });
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = variant === 'press' ? 'All years' : 'All categories';
  facet.append(opt0);
  [...facets].sort().reverse().forEach((f) => {
    const o = document.createElement('option');
    o.value = f;
    o.textContent = f;
    facet.append(o);
  });

  let shown = 0;
  let filtered = rows;
  const render = (reset) => {
    if (reset) { list.textContent = ''; shown = 0; }
    filtered.slice(shown, shown + PAGE_SIZE).forEach((r) => list.append(card(r, variant)));
    shown = Math.min(shown + PAGE_SIZE, filtered.length);
    more.hidden = shown >= filtered.length;
  };
  const applyFilters = () => {
    const q = search.value.trim().toLowerCase();
    const f = facet.value;
    filtered = rows.filter((r) => {
      if (f) {
        if (variant === 'press') {
          const y = (r.publishdate || '').slice(0, 4) || (r.path.match(/\/press-release\/(\d{4})\//) || [])[1];
          if (y !== f) return false;
        } else if (r.category !== f) return false;
      }
      if (q) return `${r.title} ${r.description}`.toLowerCase().includes(q);
      return true;
    });
    render(true);
  };
  search.addEventListener('input', applyFilters);
  facet.addEventListener('change', applyFilters);
  more.addEventListener('click', () => render(false));
  render(true);
}

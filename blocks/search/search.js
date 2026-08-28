/* site search — client-side over the query-index (replaces source
   /search-results and /product-search on migrated pages).
   Surface: Figma web kit F4 Search Bar (set 1809:125607, gate 1809:131418;
   variants: Search Dropdown filters / General Search) + F4A Search No
   Results (set 3490:44238). The pre-restyle behavior contract is
   preserved byte-for-byte on the default path: fetch of
   /query-index.json?limit=5000 on first query, the same term/title
   scoring, ?q= URL sync via replaceState, results as ul > li > a >
   h3 + p, status via role="status". Filters (block class `filters`),
   quick-find (block class `quick-find`) and the F4A no-results anatomy
   are additive.
   Authoring: cells are ignored ("auto"), except an optional <ul> whose
   items override the default Search-tips copy (F4A right column). */

// System / Search 24 glyph baked in the kit A6 instance (1809:131421)
const SEARCH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10.0001 2.00018C14.4183 2.00022 18.0001 5.58192 18.0001 10.0002C18 11.8487 17.3704 13.5489 16.3175 14.9035L21.7071 20.2931C22.0976 20.6837 22.0976 21.3167 21.7071 21.7072C21.3466 22.0677 20.7791 22.0952 20.3868 21.7902L20.293 21.7072L14.9034 16.3176C13.5488 17.3705 11.8486 18.0002 10.0001 18.0002C5.58186 18.0002 2.00017 14.4184 2.00008 10.0002C2.00008 5.5819 5.5818 2.00018 10.0001 2.00018ZM10.0001 4.00018C6.68637 4.00018 4.00008 6.68647 4.00008 10.0002C4.00017 13.3138 6.68643 16.0002 10.0001 16.0002C13.3137 16.0001 16 13.3138 16.0001 10.0002C16.0001 6.68649 13.3137 4.00022 10.0001 4.00018Z" fill="currentColor"/></svg>';

const DEFAULT_TIPS = [
  'Make sure all words are spelled correctly',
  'Try using fewer words',
  'Try more general keywords',
  'Don\'t start your search with a " or a ?',
];

const UNAVAILABLE = 'Search is unavailable right now. Please try again later.';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function titleCase(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// display title without the site-name prefix the index bakes into titles
function shortTitle(r) {
  return (r.title || '').replace(/^Broadridge - /, '').trim();
}

export default async function decorate(block) {
  const authoredTips = [...block.querySelectorAll('li')]
    .map((li) => li.textContent.trim()).filter(Boolean);
  block.textContent = '';

  const withFilters = block.classList.contains('filters');
  const withQuickfind = block.classList.contains('quick-find');
  const params = new URLSearchParams(window.location.search);

  /* card (F4 module shell 1809:131418) */
  const card = el('div', 'search-card');
  const form = el('form', 'search-form');
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search...'; // kit specimen placeholder (I1809:131420)
  input.setAttribute('aria-label', 'Search');
  const btn = el('button', 'button search-submit');
  btn.type = 'submit';
  btn.innerHTML = `${SEARCH_ICON}<span>Search</span>`;
  form.append(input, btn);
  card.append(form);

  /* dropdown filters (2285:13635) — additive: they refine the scored set */
  const selects = {};
  if (withFilters) {
    const filters = el('div', 'search-filters');
    const mk = (name, label, options) => {
      const field = el('div', 'search-filter');
      const lab = el('label', '', label);
      lab.setAttribute('for', `search-${name}`);
      const sel = document.createElement('select');
      sel.id = `search-${name}`;
      sel.name = name;
      options.forEach(([value, text]) => {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = text;
        sel.append(o);
      });
      sel.classList.toggle('filled', !!sel.value);
      field.append(lab, sel);
      filters.append(field);
      selects[name] = sel;
    };
    mk('industry', 'Industries', [['', 'Filter results by industries']]);
    mk('type', 'Content type', [['', 'Filter results by content type']]);
    mk('sort', 'Sort', [['relevance', 'Sort by relevance'], ['latest', 'Sort by latest']]);
    card.append(filters);
  }

  /* quick find (General Search variant, 3099:80713) */
  let quickfind = null;
  if (withQuickfind) {
    quickfind = el('nav', 'search-quickfind');
    quickfind.setAttribute('aria-label', 'Quick find');
    ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].forEach((letter) => {
      const b = el('button', 'search-letter', letter);
      b.type = 'button';
      quickfind.append(b);
    });
    card.append(quickfind);
  }

  const status = el('p', 'search-status');
  status.setAttribute('role', 'status');
  const results = el('ul', 'search-results');
  const noresults = el('div', 'search-noresults');
  noresults.hidden = true;
  const body = el('div', 'search-body');
  body.append(status, results, noresults);
  block.append(card, body);

  let index = null;
  async function loadIndex() {
    if (index) return index;
    const resp = await fetch('/query-index.json?limit=5000');
    if (!resp.ok) throw new Error(`query-index ${resp.status}`);
    index = (await resp.json()).data;
    // populate filter options from the real index facets
    if (selects.industry) {
      [...new Set(index.map((r) => r.category).filter(Boolean))].sort()
        .forEach((c) => selects.industry.append(new Option(titleCase(c), c)));
      if (params.get('industry')) selects.industry.value = params.get('industry');
      selects.industry.classList.toggle('filled', !!selects.industry.value);
    }
    if (selects.type) {
      [...new Set(index.map((r) => r.template).filter(Boolean))].sort()
        .forEach((t) => selects.type.append(new Option(titleCase(t), t)));
      if (params.get('type')) selects.type.value = params.get('type');
      selects.type.classList.toggle('filled', !!selects.type.value);
    }
    // quick-find letters with no titles take the kit disabled ink
    if (quickfind) {
      const initials = new Set(index.map((r) => shortTitle(r).charAt(0).toUpperCase()));
      [...quickfind.children].forEach((b) => {
        const L = b.textContent;
        const any = L === '#'
          ? [...initials].some((c) => c && !/[A-Z]/.test(c))
          : initials.has(L);
        b.disabled = !any;
      });
    }
    return index;
  }
  // prefetch on first interaction so filter options exist before the
  // menu opens (no load-time fetch; the 404 path degrades in run())
  card.addEventListener('focusin', () => loadIndex().catch(() => {}), { once: true });

  function clearNoResults() {
    block.classList.remove('no-results');
    noresults.hidden = true;
    noresults.textContent = '';
  }

  function renderRows(rows) {
    results.textContent = '';
    rows.forEach((r) => {
      const li = el('li', 'search-item');
      const a = document.createElement('a');
      a.href = r.path;
      const h3 = el('h3', '', r.title);
      a.append(h3);
      if (r.description) a.append(el('p', '', r.description));
      li.append(a);
      results.append(li);
    });
  }

  /* F4A Search No Results (3490:44235) */
  function renderNoResults(q) {
    block.classList.add('no-results');
    status.textContent = `We're sorry, no results were found for your search: "${q}".`;
    noresults.hidden = false;
    noresults.textContent = '';
    noresults.append(el('p', 'search-noresults-again', 'Try searching again above.'));
    const columns = el('div', 'search-noresults-columns');
    // derived: suggestions are index titles sharing the query's initial
    // (alphabetical, max 4); fallback to the first titles alphabetically
    const titles = [...new Set(index.map(shortTitle).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const first = q.trim().charAt(0).toLowerCase();
    let sugg = titles.filter((t) => t.charAt(0).toLowerCase() === first);
    if (!sugg.length) sugg = titles;
    const suggest = el('div', 'search-suggest');
    suggest.append(el('p', 'search-noresults-title', 'Did you mean?'));
    const sul = document.createElement('ul');
    sugg.slice(0, 4).forEach((t) => {
      const li = document.createElement('li');
      const a = el('a', '', t);
      a.href = `?q=${encodeURIComponent(t)}`;
      li.append(a);
      sul.append(li);
    });
    suggest.append(sul);
    const tips = el('div', 'search-tips');
    tips.append(el('p', 'search-noresults-title', 'Search tips'));
    const tul = document.createElement('ul');
    (authoredTips.length ? authoredTips : DEFAULT_TIPS)
      .forEach((t) => tul.append(el('li', '', t)));
    tips.append(tul);
    columns.append(suggest, tips);
    noresults.append(columns);
  }

  async function run(q) {
    if (!q) return;
    if (!index) status.textContent = 'Loading…';
    try {
      await loadIndex();
    } catch {
      clearNoResults();
      results.textContent = '';
      status.textContent = UNAVAILABLE;
      return;
    }
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let scored = index.map((r) => {
      const hay = `${r.title} ${r.description}`.toLowerCase();
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0)
        + (r.title || '').toLowerCase().includes(q.toLowerCase()) * 2;
      return [score, r];
    }).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]);
    if (selects.industry && selects.industry.value) {
      scored = scored.filter(([, r]) => r.category === selects.industry.value);
    }
    if (selects.type && selects.type.value) {
      scored = scored.filter(([, r]) => r.template === selects.type.value);
    }
    if (selects.sort && selects.sort.value === 'latest') {
      scored.sort((a, b) => (b[1].lastModified || 0) - (a[1].lastModified || 0));
    }
    scored = scored.slice(0, 50);
    if (!scored.length) {
      results.textContent = '';
      renderNoResults(q);
      return;
    }
    clearNoResults();
    status.textContent = `${scored.length} result${scored.length === 1 ? '' : 's'} for “${q}”`;
    renderRows(scored.map(([, r]) => r));
  }

  function syncUrl() {
    const url = new URL(window.location);
    url.searchParams.set('q', input.value.trim());
    Object.entries(selects).forEach(([name, sel]) => {
      if (sel.value && !(name === 'sort' && sel.value === 'relevance')) {
        url.searchParams.set(name, sel.value);
      } else url.searchParams.delete(name);
    });
    window.history.replaceState({}, '', url);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    syncUrl();
    run(input.value.trim());
  });

  Object.values(selects).forEach((sel) => {
    sel.addEventListener('change', () => {
      sel.classList.toggle('filled', !!sel.value);
      const q = input.value.trim();
      if (q) { syncUrl(); run(q); }
    });
  });

  if (quickfind) {
    quickfind.addEventListener('click', async (e) => {
      const b = e.target.closest('.search-letter');
      if (!b) return;
      const L = b.textContent;
      status.textContent = 'Loading…';
      try {
        await loadIndex();
      } catch {
        status.textContent = UNAVAILABLE;
        return;
      }
      clearNoResults();
      const rows = index
        .filter((r) => {
          const c = shortTitle(r).charAt(0).toUpperCase();
          return L === '#' ? (c && !/[A-Z]/.test(c)) : c === L;
        })
        .sort((a, b) => shortTitle(a).localeCompare(shortTitle(b)))
        .slice(0, 50);
      status.textContent = `${rows.length} page${rows.length === 1 ? '' : 's'} starting with “${L}”`;
      renderRows(rows);
    });
  }

  // suggestion links run the suggested query through the same path
  noresults.addEventListener('click', (e) => {
    const a = e.target.closest('.search-suggest a');
    if (!a) return;
    e.preventDefault();
    input.value = a.textContent;
    syncUrl();
    run(input.value);
  });

  const initSort = params.get('sort');
  if (initSort && selects.sort) {
    selects.sort.value = initSort;
    selects.sort.classList.toggle('filled', !!selects.sort.value);
  }
  const initial = params.get('q');
  if (initial) { input.value = initial; run(initial); }
}

/* site search — client-side over the query-index (replaces source /search-results) */
export default async function decorate(block) {
  block.textContent = '';
  const form = document.createElement('form');
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search broadridge.com';
  input.setAttribute('aria-label', 'Search');
  const btn = document.createElement('button');
  btn.className = 'button';
  btn.type = 'submit';
  btn.textContent = 'Search';
  form.append(input, btn);
  const results = document.createElement('ul');
  results.className = 'search-results';
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  block.append(form, status, results);

  let index = null;
  async function run(q) {
    if (!q) return;
    if (!index) {
      status.textContent = 'Loading…';
      const resp = await fetch('/query-index.json?limit=5000');
      index = (await resp.json()).data;
    }
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = index.map((r) => {
      const hay = `${r.title} ${r.description}`.toLowerCase();
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0)
        + (r.title || '').toLowerCase().includes(q.toLowerCase()) * 2;
      return [score, r];
    }).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 50);
    results.textContent = '';
    status.textContent = `${scored.length} result${scored.length === 1 ? '' : 's'} for “${q}”`;
    scored.forEach(([, r]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = r.path;
      const h3 = document.createElement('h3');
      h3.textContent = r.title;
      a.append(h3);
      if (r.description) {
        const p = document.createElement('p');
        p.textContent = r.description;
        a.append(p);
      }
      li.append(a);
      results.append(li);
    });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    const url = new URL(window.location);
    url.searchParams.set('q', q);
    window.history.replaceState({}, '', url);
    run(q);
  });
  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial) { input.value = initial; run(initial); }
}

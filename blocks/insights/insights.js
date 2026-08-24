/*
 * insights — curated cards stay 1:1 with source; when a card links to an
 * indexed page, title/image are enriched from the query-index (Tier-1 data).
 */
async function enrich(block) {
  try {
    const resp = await fetch('/query-index.json?limit=3000');
    if (!resp.ok) return;
    const { data } = await resp.json();
    const byPath = new Map(data.map((r) => [r.path, r]));
    block.querySelectorAll('h3 a[href^="/"]').forEach((a) => {
      const rec = byPath.get(new URL(a.href, window.location).pathname);
      if (!rec) return;
      const card = a.closest('.insights > div');
      if (card && !card.querySelector('img') && rec.image && !rec.image.endsWith('/default-meta-image.png')) {
        const img = document.createElement('img');
        img.src = rec.image;
        img.alt = '';
        img.loading = 'lazy';
        card.querySelector('div').prepend(img);
      }
    });
  } catch (e) {
    // enrichment is best-effort; curated content already renders
  }
}

export default function decorate(block) {
  block.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
  enrich(block);
}

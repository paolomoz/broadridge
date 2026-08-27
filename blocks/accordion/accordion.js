/* accordion — Figma web kit A1 Accordion (1955:334445) + M2 Accordion
   Feature (1568:70602, `accordion (feature)`) + M14 FAQ Accordion
   (14196:37097, `accordion (faq)`).
   Rows are classified structurally (authors may omit header/media/CTA):
   heading row -> accordion-header, picture-only row -> shared media
   (feature: desktop right column per 1952:309363, inside the open item at
   tablet/mobile per 1801:178306/178320), link row -> accordion-cta,
   two-cell rows -> accordion items (label + content).
   Expand/collapse: 400ms motion.duration.medium4 + motion.easing.standard —
   derived from the kit's M9 accordion prototype; the M2/M14 boards document
   no motion (Specs board 5111:76577 covers layout/anatomy only). Honors
   prefers-reduced-motion (no height animation).
   FAQ variant emits schema.org FAQPage JSON-LD from the authored Q/A pairs —
   derived from SEO practice, not a kit mandate. */

const DESKTOP = window.matchMedia('(width >= 1140px)');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

function tokenMs(name, fallback) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function tokenEasing(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function animateBody(body, expandIt, onDone) {
  if (REDUCED.matches || !body.animate) {
    onDone?.();
    return;
  }
  const height = `${body.getBoundingClientRect().height}px`;
  const frames = expandIt
    ? [{ height: '0px', opacity: 0 }, { height, opacity: 1 }]
    : [{ height, opacity: 1 }, { height: '0px', opacity: 0 }];
  body.style.overflow = 'hidden';
  const anim = body.animate(frames, {
    // derived from M9's documented accordion motion (400ms medium4,
    // standard.decelerate — see tabs.js); M2/M14 boards specify none
    duration: tokenMs('--motion-duration-medium4', 400),
    easing: tokenEasing('--motion-easing-standard-decelerate', 'cubic-bezier(0, 0, 0, 1)'),
  });
  anim.onfinish = () => {
    body.style.overflow = '';
    onDone?.();
  };
}

/* two-cell row -> A1/A26 details item */
function buildItem(row, id) {
  const [label, ...bodies] = row.children;
  const details = document.createElement('details');
  details.className = 'accordion-item';
  details.id = id;
  const summary = document.createElement('summary');
  summary.className = 'accordion-item-label';
  summary.append(...label.childNodes);
  // unwrap authored heading/paragraph wrappers — the label is Title-2 text
  summary.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
    el.replaceWith(...el.childNodes);
  });
  const body = document.createElement('div');
  body.className = 'accordion-item-body';
  bodies.forEach((cell) => body.append(...cell.childNodes));
  details.append(summary, body);
  row.replaceWith(details);
  return details;
}

/* M2: the shared media renders in the desktop column, or inside the open
   item below its content at tablet/mobile (1801:178310) */
function placeMedia(block, media) {
  if (DESKTOP.matches) {
    block.append(media);
    return;
  }
  const open = block.querySelector('.accordion-item[open]');
  if (open) open.querySelector('.accordion-item-body').append(media);
  else block.append(media);
}

/* schema.org FAQPage from the authored Q/A pairs (SEO-derived, not kit) */
function emitFaqJsonLd(items) {
  const mainEntity = items
    .map((d) => ({
      '@type': 'Question',
      name: d.querySelector('.accordion-item-label').textContent.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: d.querySelector('.accordion-item-body').textContent.trim().replace(/\s+/g, ' '),
      },
    }))
    .filter((q) => q.name && q.acceptedAnswer.text);
  if (!mainEntity.length) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  });
  document.head.append(script);
}

export default function decorate(block) {
  const feature = block.classList.contains('feature');
  const faq = block.classList.contains('faq');
  const items = [];
  let media = null;
  const slugs = new Set();

  [...block.children].forEach((row) => {
    if (row.children.length >= 2) {
      const label = row.children[0].textContent.trim();
      let id = slugify(label) || 'accordion-item';
      for (let n = 2; slugs.has(id) || document.getElementById(id); n += 1) {
        id = `${slugify(label)}-${n}`;
      }
      slugs.add(id);
      items.push(buildItem(row, id));
      return;
    }
    if (row.querySelector('h1, h2, h3, h4')) {
      row.classList.add('accordion-header');
      return;
    }
    if (row.querySelector('picture, img') && !row.textContent.trim()) {
      media = document.createElement('div');
      media.className = 'accordion-media';
      media.append(row.querySelector('picture') || row.querySelector('img'));
      row.remove();
      return;
    }
    if (row.querySelector('a')) {
      row.classList.add('accordion-cta');
      return;
    }
    if (!row.textContent.trim()) row.remove();
  });

  // group consecutive items so the FAQ body can carry its top rule and the
  // feature column can space header/items/CTA on the kit rhythm
  const list = document.createElement('div');
  list.className = 'accordion-items';
  if (items.length) {
    items[0].before(list);
    items.forEach((d) => list.append(d));
  } else {
    block.append(list);
  }

  if (feature) {
    // Features Block wrapper = kit content column (2463:26495)
    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.append(...block.children);
    block.append(content);
    // link-only body paragraphs are the kit's A12 arrow link (354:1603)
    block.querySelectorAll('.accordion-item-body p > a:only-child').forEach((a) => {
      if (a.closest('p').textContent.trim() === a.textContent.trim()) a.classList.add('cta-link');
    });
    // the kit composition keeps one item open (gate frame 1952:309363)
    if (items.length) items[0].open = true;
    if (media) {
      placeMedia(block, media);
      DESKTOP.addEventListener('change', () => placeMedia(block, media));
    }
  }

  // deep link: #<question-slug> opens its item
  const target = window.location.hash
    && items.find((d) => `#${d.id}` === window.location.hash);
  if (target) target.open = true;

  // animated, feature-exclusive toggling
  items.forEach((details) => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.accordion-item-body');
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (details.open) {
        animateBody(body, false, () => { details.open = false; });
      } else {
        if (feature) {
          items.filter((d) => d.open && d !== details).forEach((d) => {
            animateBody(d.querySelector('.accordion-item-body'), false, () => { d.open = false; });
          });
        }
        details.open = true;
        if (feature && media) placeMedia(block, media);
        animateBody(body, true);
      }
    });
  });

  if (faq) emitFaqJsonLd(items);
}

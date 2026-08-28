/* sticky-nav — Figma web kit F3 Sticky Nav (page 1793:55698, set
   1793:55789, core states 2921:54955).

   AUTHORING CONTRACT
   - Each block row is one anchor link: a cell holding a link whose href
     is an in-page hash (#target-id) and whose text is the label.
     A single row holding a <ul> of such links is equivalent. Authors
     control label and order; targets are the sections/headings the
     hashes point at. Non-hash links are dropped (decorate defensively).
   - The block must be authored in its own section: the section becomes
     the sticky element (position:sticky needs main as containing
     block). It renders the F3 band on the extended grid and sticks 8px
     beneath the pinned site header — kit spec 3232:558250 ("Once
     scrolled to, the sticky nav stacks beneath the main header
     navigation with 8px of space between").
   - Active state: "As the user scrolls the page, the link title should
     update as they enter and leave each section" (spec 3232:562734) —
     driven by an IntersectionObserver on the hash targets; the active
     target is the last one whose top has passed the line just under
     the stuck bar. The observer mechanics and the sticky offset
     (--site-header-height + 8) are derived from the web platform, not
     the kit (recorded in gates/components/f3-sticky-nav/tolerances.md).
   - Mobile (< 834): closed bar = back-to-top + current section label +
     chevron; the chevron opens the kit's full-screen Mobile Open
     drawer (3232:556706, spec 3232:561132: full screen overlay, active
     link reflects the scrolled section, selecting a link closes the
     menu and scrolls to its anchor). Escape/chevron-close and focus
     handling are derived a11y additions (recorded).
   - Desktop/tablet paddles: back-to-top A6 (always shown, kit
     1793:56416); overflow-scroll A6 shown only when the link row
     actually overflows — it pages the row and flips to point left at
     the end (specs 3232:557945/558166). Scrolling keeps the active
     link near the center "when possible" (spec 3232:557953).
   - All programmatic scrolling honors prefers-reduced-motion ("easy
     scroll" in 3232:561132 -> smooth only when motion is allowed).
   - The kit's A20 Timer (2810:10536) is hidden/futureTimer=false in
     every variant — not built. */

/* Arrows / Arrow Bar To Up (kit asset d6956a6f) — back-to-top */
const ICON_TO_TOP = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M11.2793 9.28027C11.6478 8.90237 12.2303 8.88163 12.6309 9.21777C12.6579 9.2398 12.6837 9.26384 12.709 9.28906L16.709 13.2891C17.099 13.6691 17.099 14.3092 16.709 14.6992H16.6992C16.5092 14.8791 16.2491 14.9893 15.9893 14.9893L16 15C15.7301 14.9999 15.47 14.8899 15.29 14.71L13 12.4199V20C13 20.55 12.55 21 12 21C11.44 21 11 20.55 11 20V12.3994L8.69922 14.7002C8.50924 14.88 8.24913 14.9902 7.98926 14.9902L8 15C7.73 15 7.46906 14.89 7.28906 14.71C6.88937 14.32 6.88953 13.68 7.2793 13.29V13.2803L11.2793 9.28027ZM20 3C20.55 3 21 3.44 21 4C21 4.55 20.55 5 20 5H4C3.44 5 3 4.55 3 4C3 3.44 3.44 3 4 3H20Z" fill="currentColor"/>
</svg>`;

/* Arrows / Arrow Narrow Right (kit asset c39ed2c6) — overflow paddle */
const ICON_SCROLL = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M14.29 7.29915C14.68 6.90007 15.31 6.90022 15.71 7.29915L19.71 11.2913C19.9339 11.5091 20.0284 11.8123 19.9951 12.1048C19.9679 12.3896 19.8189 12.6394 19.6016 12.804L15.6992 16.6995C15.5092 16.8791 15.2492 16.9886 14.9893 16.9886L15 17.0003C14.73 17.0003 14.4691 16.8899 14.2891 16.7103C13.8895 16.3211 13.8895 15.6824 14.2793 15.2933V15.2835L16.5596 13.0081H5C4.44005 13.0081 4.00008 12.5589 4 12.0101C4 11.4512 4.44 11.012 5 11.012H16.5801L14.29 8.72688V8.71614C13.8903 8.31693 13.8901 7.68827 14.29 7.29915Z" fill="currentColor"/>
</svg>`;

/* Arrows / Chevron Down, 20px (kit asset 9682acb3) — mobile toggle */
const ICON_CHEVRON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.41074 6.91074C4.71115 6.61034 5.18384 6.58723 5.51075 6.84142L5.58926 6.91074L10 11.3208L14.4107 6.91074C14.7111 6.61034 15.1838 6.58723 15.5108 6.84142L15.5893 6.91074C15.8897 7.21115 15.9128 7.68384 15.6586 8.01075L15.5893 8.08926L10.5893 13.0893C10.2889 13.3897 9.81616 13.4128 9.48925 13.1586L9.41074 13.0893L4.41074 8.08926C4.08531 7.76382 4.08531 7.23618 4.41074 6.91074Z" fill="currentColor"/>
</svg>`;

const motionOK = () => window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
let blockIndex = 0;

export default function decorate(block) {
  blockIndex += 1;

  // gather authored anchor links (rows of cells or a single list)
  // labels keep authored NBSPs (kit specimens bake them); plain edge
  // whitespace collapses in rendering anyway
  const authored = [...block.querySelectorAll('a')]
    .map((a) => ({ label: a.textContent, hash: a.getAttribute('href') || '' }))
    .map((l) => ({ ...l, hash: l.hash.includes('#') ? l.hash.slice(l.hash.indexOf('#')) : '' }))
    .filter((l) => l.label.trim() && l.hash.length > 1);
  block.textContent = '';
  if (!authored.length) return;

  const nav = document.createElement('nav');
  nav.className = 'sticky-nav-bar';
  nav.setAttribute('aria-label', 'Section navigation');

  // back-to-top — A6 Button (1793:56416)
  const toTopWrap = document.createElement('div');
  toTopWrap.className = 'sticky-nav-totop-wrap';
  const toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'sticky-nav-totop';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = ICON_TO_TOP;
  toTopWrap.append(toTop);

  // mobile toggle — current link label + chevron (1793:56296)
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sticky-nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', `sticky-nav-links-${blockIndex}`);
  toggle.innerHTML = `<span class="sticky-nav-current"></span><span class="sticky-nav-toggle-icon">${ICON_CHEVRON}</span>`;
  const current = toggle.querySelector('.sticky-nav-current');

  // link row / drawer list (.F3 Sticky Nav Core instances)
  const scroller = document.createElement('div');
  scroller.className = 'sticky-nav-scroller';
  scroller.id = `sticky-nav-links-${blockIndex}`;
  const list = document.createElement('ul');
  list.className = 'sticky-nav-list';
  const links = authored.map(({ label, hash }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'sticky-nav-link';
    a.href = hash;
    a.innerHTML = '<span class="sticky-nav-label"></span>';
    a.querySelector('.sticky-nav-label').textContent = label;
    li.append(a);
    list.append(li);
    return a;
  });
  scroller.append(list);

  // overflow-scroll paddle — A6 Button (2777:312132)
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'sticky-nav-more';
  more.setAttribute('aria-label', 'Scroll section links');
  more.innerHTML = ICON_SCROLL;
  more.hidden = true;

  nav.append(toTopWrap, toggle, scroller, more);
  block.append(nav);

  current.textContent = authored[0].label; // fallback before any section is reached

  const enableMotion = () => block.classList.add('sticky-nav-motion');
  const scrollBehavior = () => (block.classList.contains('sticky-nav-motion') && motionOK() ? 'smooth' : 'auto');

  // ---- sticky offset + anchor scroll margin (derived: header.css pins
  // --site-header-height once scrolled; kit gap 8; +bar height +8) ----
  const stickyTop = () => {
    const section = block.closest('.section') || block;
    const top = parseFloat(getComputedStyle(section).top);
    return Number.isNaN(top) ? 88 : top;
  };
  const barBottom = () => stickyTop() + nav.getBoundingClientRect().height + 8;

  const targets = authored
    .map(({ hash }, i) => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      return el ? { el, link: links[i], label: authored[i].label } : null;
    })
    .filter(Boolean);

  const applyScrollMargins = () => {
    const m = `${Math.round(barBottom())}px`;
    targets.forEach(({ el }) => { el.style.scrollMarginTop = m; });
  };

  // ---- active tracking (spec 3232:562734) ----
  const centerActive = (link) => {
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    const left = link.offsetLeft + link.offsetWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollTo({ left, behavior: scrollBehavior() });
  };

  let active = null;
  const setActive = (t) => {
    if (t === active) return;
    active = t;
    links.forEach((a) => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
    if (t) {
      t.link.classList.add('active');
      t.link.setAttribute('aria-current', 'true');
      current.textContent = t.label;
      centerActive(t.link);
    } else {
      current.textContent = authored[0].label;
    }
  };

  // observer band: 1px strip just under the stuck bar; a target is
  // active once its top passes the band's bottom edge (both the enter
  // and leave callbacks deliver with the top just past that edge)
  const bandTop = () => Math.round(barBottom()) + 1;

  // active = last target whose top has passed the band; none while the
  // bar has not reached the first target (kit Resting)
  const computeActive = () => {
    const line = bandTop() + 1;
    let found = null;
    targets.forEach((t) => {
      if (t.el.getBoundingClientRect().top <= line) found = t;
    });
    setActive(found);
  };

  let io = null;
  const observe = () => {
    if (io) io.disconnect();
    // adjusted root = the 1px band, so a callback fires exactly when a
    // target edge crosses it and we recompute (<= 8 rects); rebuilt on
    // resize (the margins embed viewport + bar heights)
    const line = bandTop();
    io = new IntersectionObserver(computeActive, {
      rootMargin: `-${line}px 0px ${line + 1 - window.innerHeight}px 0px`,
    });
    targets.forEach(({ el }) => io.observe(el));
  };

  // ---- overflow paddle (specs 3232:557945/557953/558166) ----
  const updateMore = () => {
    const overflow = scroller.scrollWidth > scroller.clientWidth + 1;
    more.hidden = !overflow;
    if (!overflow) return;
    const atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1;
    more.classList.toggle('flipped', atEnd);
    more.setAttribute('aria-label', atEnd ? 'Scroll section links back' : 'Scroll section links');
  };
  scroller.addEventListener('scroll', updateMore, { passive: true });
  more.addEventListener('click', () => {
    enableMotion();
    const page = scroller.clientWidth * 0.8;
    const delta = more.classList.contains('flipped') ? -page : page;
    scroller.scrollBy({ left: delta, behavior: scrollBehavior() });
  });

  // ---- back-to-top ----
  toTop.addEventListener('click', () => {
    enableMotion();
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  });

  // ---- mobile drawer (spec 3232:561132) ----
  const setOpen = (open, { focus = true } = {}) => {
    block.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && focus) (active ? active.link : links[0]).focus();
    if (!open && focus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    enableMotion();
    setOpen(!block.classList.contains('open'));
  });
  // Escape close is a derived a11y addition (kit: exit by selecting a link)
  block.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && block.classList.contains('open')) setOpen(false);
  });
  const mobile = window.matchMedia('(width < 834px)');
  mobile.addEventListener('change', (e) => {
    if (!e.matches && block.classList.contains('open')) setOpen(false, { focus: false });
  });

  // link click: close the drawer, then "easy scroll to the associated
  // anchor point" — smooth only when motion is allowed (scroll margins
  // already set on the targets)
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      enableMotion();
      if (block.classList.contains('open')) setOpen(false, { focus: false });
      const t = targets.find((x) => x.link === a);
      if (t) {
        e.preventDefault();
        window.history.pushState(null, '', a.getAttribute('href'));
        t.el.scrollIntoView({ behavior: scrollBehavior() });
      }
    });
  });

  const refresh = () => {
    applyScrollMargins();
    observe();
    computeActive();
    updateMore();
  };
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refresh, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  // decorate runs while the section is still hidden (aem.js reveals it
  // after the block loads) — re-measure when the scroller gets laid out
  new ResizeObserver(refresh).observe(scroller);
  refresh();
}

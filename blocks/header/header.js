/*
 * Broadridge N1 Header + N3 Mega Menu + N4 Mobile Menu
 * (kit pages 537:99312 / 1754:237545 / 2712:137995).
 *
 * Content contract (unchanged from the production /nav fragment):
 *   section 1: brand      — logo picture wrapped in a link
 *   section 2: sections   — ul of top-level items; an item with a nested ul
 *                           opens a flyout (desktop) / accordion (mobile);
 *                           an item whose nested lis carry their own uls is a
 *                           capability menu (tab rail, N3 "C" flyouts);
 *                           a bare `<li><a>` is a direct link (kit About us
 *                           specimen, 10035:11689)
 *   section 3: tools      — ul of utility links; `<strong>` link = Contact us
 *                           CTA (main row); a link to the search page becomes
 *                           the search trigger (N1 Search states)
 * Optional additive shapes (ignored by the kit-less production fragment):
 *   - a li containing a <picture> inside a section ul  -> featured tout
 *     (picture + <p>title</p> + <p><a>link</a></p>), N3 10035:11830/11850
 *   - a li containing a <picture> inside a capability group ul -> overview
 *     tout (picture + <p>description</p>), N3 10035:11721
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// kit responsive contract (10035:10073): desktop 1440-835, tablet 834-431,
// mobile <=430. The desktop nav row physically needs ~1060px with the kit
// metrics (items 32 gap + 64 CTA gap + 64 paddings + 64 margins), so the
// desktop cutover ships at 1100px (derived; recorded in tolerances.md).
const isDesktop = window.matchMedia('(min-width: 1100px)');

const SEARCH_DELAY = 1000; // --animation-search-delay (10035:10077)

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function icon(name) {
  const s = el('span', `br-icon br-icon-${name}`);
  s.setAttribute('aria-hidden', 'true');
  return s;
}

/* ---------- fragment parsing (read-only over the fragment DOM) ---------- */

function parseTout(li) {
  // featured/overview tout li: <picture> + <p>title/desc</p> [+ <p><a>]
  const picture = li.querySelector('picture');
  if (!picture) return null;
  const link = li.querySelector('a');
  const text = [...li.querySelectorAll('p')]
    .map((p) => p.textContent.trim())
    .find((t) => t && (!link || t !== link.textContent.trim()));
  return { picture, title: text || '', link };
}

function parseItems(ul) {
  const items = [];
  let tout = null;
  [...ul.children].forEach((li) => {
    if (li.querySelector(':scope > ul')) return; // group, handled by caller
    const t = parseTout(li);
    if (t) { tout = t; return; }
    const a = li.querySelector('a');
    if (a) items.push(a);
  });
  return { items, tout };
}

function parseSection(li) {
  const ul = li.querySelector(':scope > ul');
  const directLink = li.querySelector(':scope > a, :scope > p > a');
  const title = (li.querySelector(':scope > p') || directLink || li).textContent.trim();
  if (!ul) return { title, link: directLink, type: 'link' };
  const groups = [...ul.children]
    .filter((g) => g.querySelector(':scope > ul'))
    .map((g) => {
      const gul = g.querySelector(':scope > ul');
      const { items, tout } = parseItems(gul);
      return { title: g.querySelector(':scope > p, :scope > a')?.textContent.trim() || '', items, tout };
    });
  if (groups.length) return { title, type: 'capability', groups };
  const { items, tout } = parseItems(ul);
  return { title, type: 'section', items, tout };
}

/* ---------------------------- desktop flyouts --------------------------- */

function buildFeaturedTout(tout) {
  const a = el('a', 'flyout-tout');
  if (tout.link) a.href = tout.link.getAttribute('href');
  const img = el('div', 'tout-image');
  img.append(tout.picture.cloneNode(true));
  const body = el('div', 'tout-body');
  body.append(el('p', 'tout-title', tout.title));
  if (tout.link) {
    const lk = el('span', 'tout-link');
    lk.append(el('span', 'tout-link-label', tout.link.textContent.trim()), icon('arrow-right'));
    body.append(lk);
  }
  a.append(img, body);
  return a;
}

function buildSectionFlyout(section) {
  const inner = el('div', 'flyout-inner flyout-section');
  const colWrap = el('div', 'flyout-main');
  const all = section.items.find((a) => /^all\s/i.test(a.textContent.trim()));
  const rest = section.items.filter((a) => a !== all);
  if (all) {
    const allLink = el('a', 'flyout-all');
    allLink.href = all.getAttribute('href');
    allLink.append(el('span', '', all.textContent.trim()), icon('arrow-right'));
    colWrap.append(allLink);
    colWrap.classList.add('has-all');
  }
  const cols = el('div', `flyout-links${rest.length > 6 ? ' two-col' : ''}`);
  if (rest.length > 6) {
    // kit fills column-first (Insights 10035:11837/11844: 6 + 5)
    cols.style.gridTemplateRows = `repeat(${Math.ceil(rest.length / 2)}, auto)`;
  }
  rest.forEach((a) => {
    const card = el('a', 'flyout-link');
    card.href = a.getAttribute('href');
    card.append(el('span', '', a.textContent.trim()));
    cols.append(card);
  });
  colWrap.append(cols);
  inner.append(colWrap);
  if (section.tout) inner.append(buildFeaturedTout(section.tout));
  return inner;
}

function buildCapabilityFlyout(section) {
  const inner = el('div', 'flyout-inner flyout-capability');
  const tabs = el('div', 'flyout-tabs');
  const panes = el('div', 'flyout-secondary');
  const toutSlot = el('div', 'flyout-tout-slot');

  const renderPane = (group) => {
    panes.textContent = '';
    group.items.forEach((a) => {
      const label = el('a', 'flyout-seclink');
      label.href = a.getAttribute('href');
      label.append(el('span', '', a.textContent.trim()));
      panes.append(label);
    });
    toutSlot.textContent = '';
    if (group.tout) {
      const overview = group.items.find((a) => /overview/i.test(a.textContent));
      const t = el('a', 'flyout-overview');
      if (group.tout.link || overview) t.href = (group.tout.link || overview).getAttribute('href');
      const img = el('div', 'tout-image');
      img.append(group.tout.picture.cloneNode(true));
      const desc = el('p', 'overview-desc', group.tout.title);
      const lk = el('span', 'tout-link');
      lk.append(
        el('span', 'tout-link-label', group.tout.link ? group.tout.link.textContent.trim() : `${group.title} Overview`),
        icon('arrow-right'),
      );
      t.append(img, desc, lk);
      toutSlot.append(t);
    }
  };

  section.groups.forEach((group, i) => {
    const tab = el('button', 'flyout-tab');
    tab.type = 'button';
    tab.append(el('span', '', group.title), icon('chevron-right'));
    if (i === 0) tab.classList.add('active');
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.flyout-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderPane(group);
    });
    tab.addEventListener('mouseenter', () => tab.click());
    tabs.append(tab);
  });
  renderPane(section.groups[0]);
  inner.append(tabs, panes, toutSlot);
  return inner;
}

/* ------------------------------ N4 drawer ------------------------------- */

function buildDrawerTout(tout) {
  const a = el('a', 'drawer-tout');
  if (tout.link) a.href = tout.link.getAttribute('href');
  const img = el('div', 'tout-image');
  img.append(tout.picture.cloneNode(true));
  const body = el('div', 'tout-body');
  body.append(el('p', 'tout-title', tout.title));
  if (tout.link) {
    const lk = el('span', 'tout-link');
    lk.append(el('span', 'tout-link-label', tout.link.textContent.trim()), icon('arrow-right'));
    body.append(lk);
  }
  a.append(img, body);
  return a;
}

function makeAccordion(titleText, className) {
  const acc = el('div', className);
  const toggle = el('button', `${className}-toggle`);
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.append(el('span', `${className}-title`, titleText), icon('plus'), icon('close'));
  const panel = el('div', `${className}-panel`);
  panel.hidden = true;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    panel.hidden = open;
  });
  acc.append(toggle, panel);
  return { acc, toggle, panel };
}

function buildDrawer(sections, utilityLinks, closeDrawer) {
  const drawer = el('div', 'nav-drawer');
  const sheet = el('div', 'drawer-sheet');
  const top = el('div', 'drawer-top');
  const close = el('button', 'drawer-close a6-icon-button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close navigation');
  close.append(icon('close'));
  close.addEventListener('click', () => closeDrawer());
  top.append(close);
  sheet.append(top);

  sections.forEach((section) => {
    if (section.type === 'link') {
      const a = el('a', 'drawer-link');
      a.href = section.link ? section.link.getAttribute('href') : '#';
      a.textContent = section.title;
      sheet.append(a);
      return;
    }
    const { acc, panel } = makeAccordion(section.title, 'drawer-acc');
    if (section.type === 'section') {
      section.items.forEach((a) => {
        const card = el('a', 'n4-link');
        card.href = a.getAttribute('href');
        card.append(el('span', '', a.textContent.trim()));
        panel.append(card);
      });
      if (section.tout) panel.append(buildDrawerTout(section.tout));
    } else {
      // capability: nested accordion cards (N4 Capabilities Open, 2541:237267)
      section.groups.forEach((group) => {
        const { acc: gAcc, panel: gPanel } = makeAccordion(group.title, 'n4-acc');
        if (group.tout) gPanel.append(el('p', 'n4-acc-desc', group.tout.title));
        const lower = el('div', 'n4-acc-links');
        const overview = group.items.find((a) => /overview$/i.test(a.textContent.trim()));
        group.items.filter((a) => a !== overview).forEach((a) => {
          const link = el('a', 'n4-basic-link');
          link.href = a.getAttribute('href');
          link.textContent = a.textContent.trim();
          lower.append(link);
        });
        if (overview) {
          const btn = el('a', 'n4-acc-cta');
          btn.href = overview.getAttribute('href');
          btn.textContent = `${group.title} Overview`;
          lower.append(btn);
        }
        gPanel.append(lower);
        panel.append(gAcc);
      });
    }
    sheet.append(acc);
  });

  if (utilityLinks.length) {
    const util = el('div', 'drawer-utility');
    utilityLinks.forEach((a) => {
      const link = el('a', '', a.textContent.trim());
      link.href = a.href;
      util.append(link);
    });
    sheet.append(util);
  }
  drawer.append(sheet);
  return drawer;
}

/* ------------------------------- search --------------------------------- */

function buildSearch(nav, searchHref, focusReturn) {
  const wrap = el('div', 'nav-search');
  wrap.hidden = true;
  const band = el('div', 'nav-search-band');
  const form = el('form', 'nav-search-field');
  form.setAttribute('role', 'search');
  const input = el('input', 'nav-search-input');
  input.type = 'search';
  input.placeholder = 'Search...';
  input.setAttribute('aria-label', 'Search');
  const clear = el('button', 'nav-search-clear');
  clear.type = 'button';
  clear.hidden = true;
  clear.append(el('span', '', 'Clear'), icon('close-small'));
  form.append(input, clear);
  const closeBtn = el('button', 'nav-search-close a6-icon-button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close search');
  closeBtn.append(icon('close'));
  band.append(form, closeBtn);
  const recs = el('div', 'nav-search-recs');
  recs.hidden = true;
  wrap.append(band, recs);

  const submitTo = (term) => {
    if (!term) return;
    const url = new URL(searchHref || '/search-results', window.location);
    url.searchParams.set('q', term);
    window.location.assign(url);
  };

  const renderRecs = (list, term) => {
    recs.textContent = '';
    if (!list || !list.length) { recs.hidden = true; return; }
    list.forEach((s) => {
      const item = el('a', 'nav-search-rec');
      item.href = '#';
      if (term && s.toLowerCase().startsWith(term.toLowerCase())) {
        item.append(el('strong', '', s.slice(0, term.length)), document.createTextNode(s.slice(term.length)));
      } else item.textContent = s;
      item.addEventListener('click', (e) => { e.preventDefault(); submitTo(s); });
      recs.append(item);
    });
    recs.hidden = false;
  };

  let timer = null;
  input.addEventListener('input', () => {
    clear.hidden = !input.value;
    if (timer) clearTimeout(timer);
    recs.hidden = true;
    const term = input.value.trim();
    if (!term) return;
    timer = setTimeout(async () => {
      // suggestion provider seam: no autocomplete endpoint exists in the
      // repo; a host page may install one (kit mandates a 1s query delay)
      const provider = window.headerSearchSuggest;
      const list = typeof provider === 'function' ? await provider(term) : window.headerSearchSuggestions;
      renderRecs(list, term);
    }, SEARCH_DELAY);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); submitTo(input.value.trim()); });
  clear.addEventListener('click', () => {
    input.value = '';
    clear.hidden = true;
    recs.hidden = true;
    input.focus();
  });

  const open = () => {
    nav.classList.add('search-open');
    wrap.hidden = false;
    input.focus();
  };
  const closeSearch = () => {
    nav.classList.remove('search-open');
    wrap.hidden = true;
    recs.hidden = true;
    if (focusReturn()) focusReturn().focus();
  };
  closeBtn.addEventListener('click', closeSearch);
  return { wrap, open, close: closeSearch };
}

/* ------------------------------ decorate -------------------------------- */

export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  // locale-aware default: /de, /jp, /cit ship their own nav fragment
  const localeMatch = window.location.pathname.match(/^\/(de|jp|cit)(\/|$)/);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : `${localePrefix}/nav`;
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  /* tools -> utility bar (N1 Promobar) + Contact us CTA */
  const navTools = nav.querySelector('.nav-tools');
  const utilityLinks = [];
  let searchLink = null;
  let ctaLink = null;
  if (navTools) {
    navTools.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
      const a = li.querySelector('a');
      if (!a) return;
      if (li.querySelector('strong')) { ctaLink = a; return; }
      if (/search/i.test(a.textContent) || /search/i.test(new URL(a.href, window.location).pathname)) {
        searchLink = a;
        return;
      }
      utilityLinks.push(a);
    });
    navTools.remove();
  }

  const utility = el('div', 'nav-utility');
  const utilList = el('ul');
  utilityLinks.forEach((a) => {
    const li = el('li');
    const link = el('a', '', a.textContent.trim());
    link.href = a.getAttribute('href');
    li.append(link);
    utilList.append(li);
  });
  let searchApi = null;
  if (searchLink) {
    const li = el('li', 'nav-search-wrapper');
    const trigger = el('button', 'nav-search-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.append(el('span', '', searchLink.textContent.trim()), icon('search'));
    li.append(trigger);
    utilList.append(li);
    searchApi = buildSearch(nav, searchLink.href, () => trigger);
    trigger.addEventListener('click', () => {
      trigger.setAttribute('aria-expanded', 'true');
      searchApi.open();
    });
  }
  utility.append(utilList);

  /* sections -> N3 flyouts (desktop) */
  const navSections = nav.querySelector('.nav-sections');
  const sectionModels = [];
  const closeAllFlyouts = () => {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li[aria-expanded="true"]')
      .forEach((li) => li.setAttribute('aria-expanded', 'false'));
  };
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
      const model = parseSection(li);
      sectionModels.push(model);
      if (model.type === 'link') {
        // direct link (kit About us specimen): bare styled link, no flyout
        const a = el('a', 'nav-drop-link', model.title);
        a.href = model.link ? model.link.getAttribute('href') : '#';
        li.textContent = '';
        li.append(a);
        return;
      }
      li.classList.add('nav-drop');
      li.setAttribute('aria-expanded', 'false');
      const toggle = el('button', 'nav-drop-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.append(el('span', '', model.title), icon('chevron-down'), icon('chevron-up'));
      const flyout = el('div', 'nav-flyout');
      const clip = el('div', 'nav-flyout-clip');
      clip.append(model.type === 'capability' ? buildCapabilityFlyout(model) : buildSectionFlyout(model));
      flyout.append(clip);
      li.textContent = '';
      li.append(toggle, flyout);

      const setOpen = (open) => {
        li.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      toggle.addEventListener('click', () => {
        if (!isDesktop.matches) return;
        const open = li.getAttribute('aria-expanded') === 'true';
        closeAllFlyouts();
        setOpen(!open);
      });
      // hover intent (kit animation notes 10035:10075: hover/mouse-enter
      // triggers; expand 300ms ease-out, collapse 150ms ease-in)
      let intent = null;
      li.addEventListener('mouseenter', () => {
        if (!isDesktop.matches) return;
        intent = setTimeout(() => {
          closeAllFlyouts();
          setOpen(true);
        }, 200);
      });
      li.addEventListener('mouseleave', () => {
        if (intent) clearTimeout(intent);
        if (!isDesktop.matches) return;
        setOpen(false);
      });
    });
  }

  /* CTA (main row) */
  const cta = el('div', 'nav-tools');
  if (ctaLink) {
    const a = el('a', 'button', ctaLink.textContent.trim());
    a.href = ctaLink.getAttribute('href');
    const p = el('p', 'button-container');
    p.append(a);
    cta.append(p);
  }

  /* hamburger + N4 drawer */
  const hamburger = el('div', 'nav-hamburger');
  const burgerBtn = el('button');
  burgerBtn.type = 'button';
  burgerBtn.setAttribute('aria-controls', 'nav');
  burgerBtn.setAttribute('aria-label', 'Open navigation');
  burgerBtn.append(icon('menu'));
  hamburger.append(burgerBtn);

  function toggleMenu(force) {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    const open = force !== undefined ? force : !expanded;
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    burgerBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open ? 'hidden' : '';
    if (open) {
      const closeBtn = nav.querySelector('.drawer-close');
      if (closeBtn) closeBtn.focus();
    }
  }
  const drawer = buildDrawer(sectionModels, utilityLinks, () => {
    toggleMenu(false);
    burgerBtn.focus();
  });
  burgerBtn.addEventListener('click', () => toggleMenu());

  /* assemble */
  const navBar = el('div', 'nav-bar');
  const navBarInner = el('div', 'nav-bar-inner');
  navBarInner.append(navBrand, navSections || '', cta, hamburger);
  navBar.append(navBarInner);
  nav.textContent = '';
  nav.append(utility, navBar);
  if (searchApi) nav.append(searchApi.wrap);
  nav.append(drawer);

  /* global interactions */
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (nav.classList.contains('search-open')) {
      searchApi.close();
      const trig = nav.querySelector('.nav-search-trigger');
      if (trig) trig.setAttribute('aria-expanded', 'false');
    } else if (nav.getAttribute('aria-expanded') === 'true' && !isDesktop.matches) {
      toggleMenu(false);
      burgerBtn.focus();
    } else {
      const openDrop = navSections && navSections.querySelector('li[aria-expanded="true"]');
      if (openDrop) {
        closeAllFlyouts();
        openDrop.querySelector('.nav-drop-toggle').focus();
      }
    }
  });
  nav.addEventListener('focusout', (e) => {
    if (!nav.contains(e.relatedTarget) && e.relatedTarget !== null) closeAllFlyouts();
  });
  isDesktop.addEventListener('change', () => {
    closeAllFlyouts();
    toggleMenu(false);
  });

  const navWrapper = el('div', 'nav-wrapper');
  navWrapper.append(nav);
  block.append(navWrapper);

  /* scroll state (kit Scroll Down, 3162:158281): the promobar scrolls away
     and the 80px bar pins with the dim/medium shadow. `header` reserves the
     118px band (styles.css), so pinning the wrapper at -38px once the
     promobar has scrolled out produces no layout jump. */
  const onScroll = () => {
    const scrolled = window.scrollY > 38;
    navWrapper.classList.toggle('is-scrolled', scrolled);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

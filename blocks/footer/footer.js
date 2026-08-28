import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * N2 Footer (kit page 537:99313, gate frame 2032:62603).
 * Content contract (per-locale /footer fragment, three sections):
 *   1. brand: logo picture, description paragraph, ticker paragraph
 *      ("BR (NYSE)" with optional price/percent), social links list
 *   2. footer-links block (column cells; see footer-links.js)
 *   3. legal: links list, global-websites links paragraph, copyright paragraph
 * The block reshapes those sections into the kit grid; unrecognized
 * fragment shapes fall back to the plain stacked rendering.
 */

const SOCIAL_ICONS = ['linkedin', 'instagram', 'youtube'];

/* Stock Price element (5260:423 Up / 5260:425 Down): label + trending
   icon + percent. Authored text stays the source of truth — a bare
   "BR (NYSE)" label renders as-is. */
function decorateTicker(p) {
  p.classList.add('footer-ticker');
  const text = p.textContent.replace(/\s+/g, ' ').trim();
  const m = text.match(/^(.+?)\s*([+-]?\d+(?:[.,]\d+)?%)$/);
  if (!m) return;
  const down = m[2].startsWith('-');
  p.classList.add(down ? 'trending-down' : 'trending-up');
  p.textContent = '';
  const label = document.createElement('span');
  label.className = 'footer-ticker-label';
  label.textContent = m[1];
  const icon = document.createElement('img');
  icon.className = 'footer-ticker-icon';
  icon.alt = down ? 'trending down' : 'trending up';
  icon.src = `${window.hlx.codeBasePath}/blocks/footer/trending-${down ? 'down' : 'up'}.svg`;
  const pct = document.createElement('span');
  pct.className = 'footer-ticker-pct';
  pct.textContent = m[2];
  p.append(label, icon, pct);
}

/* Social Icons (2032:62625): brand glyphs replace the authored labels
   (kept for assistive tech); unknown networks stay as text links */
function decorateSocial(ul) {
  ul.classList.add('footer-social');
  ul.querySelectorAll('a').forEach((a) => {
    const name = a.textContent.trim().toLowerCase();
    if (SOCIAL_ICONS.includes(name)) {
      a.classList.add('footer-social-icon', `footer-social-${name}`);
      a.setAttribute('aria-label', a.textContent.trim());
    }
  });
}

/* Global Websites (2032:62629): kit label (2032:62630) + link row;
   authored "·" separator text nodes are dropped (the kit gap replaces
   them) */
function decorateGlobal(p) {
  p.classList.add('footer-global-links');
  [...p.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) n.remove();
  });
  const wrap = document.createElement('div');
  wrap.className = 'footer-global';
  const label = document.createElement('p');
  label.className = 'footer-global-label';
  label.textContent = 'Global Websites';
  p.replaceWith(wrap);
  wrap.append(label, p);
  return wrap;
}

/* Footer Links legal row (2032:62663); privacy-choices glyph
   (3218:549869) rides the matching link */
function decorateLegal(ul) {
  ul.classList.add('footer-legal');
  const privacy = [...ul.querySelectorAll('a')]
    .find((a) => /your privacy choices/i.test(a.textContent));
  if (privacy) {
    const img = document.createElement('img');
    img.className = 'footer-privacy-icon';
    img.alt = '';
    img.src = `${window.hlx.codeBasePath}/blocks/footer/privacy-choices.png`;
    privacy.append(img);
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const localeMatch = window.location.pathname.match(/^\/(de|jp|cit)(\/|$)/);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : `${localePrefix}/footer`;
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  if (!fragment) return;
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const sections = [...footer.querySelectorAll(':scope > .section')];
  const brandContent = sections[0]?.querySelector('.default-content-wrapper');
  const linksWrapper = footer.querySelector('.footer-links-wrapper');
  const legalContent = sections[sections.length - 1]?.querySelector('.default-content-wrapper');

  if (sections.length >= 3 && brandContent && linksWrapper && legalContent) {
    // brand column content (2032:62605)
    const brand = document.createElement('div');
    brand.className = 'footer-brand';
    [...brandContent.children].forEach((el) => {
      if (el.matches('p') && el.querySelector('picture, img')) el.classList.add('footer-logo');
      else if (el.matches('p') && /\(NYSE\)/i.test(el.textContent)) decorateTicker(el);
      else if (el.matches('ul')) decorateSocial(el);
      else if (el.matches('p')) el.classList.add('footer-desc');
      brand.append(el);
    });

    // legal section content (2032:62663, 2032:62629, 2032:62637)
    let legalList; let globalWrap; let copyright;
    [...legalContent.children].forEach((el) => {
      if (el.matches('ul')) { decorateLegal(el); legalList = el; } else if (el.matches('p') && el.textContent.includes('©')) {
        el.classList.add('footer-copyright');
        copyright = el;
      } else if (el.matches('p') && el.querySelector('a')) globalWrap = decorateGlobal(el);
    });

    // kit grid: brand column (col 1-4) / navigation column (col 6-12)
    const grid = document.createElement('div');
    grid.className = 'footer-grid';
    const colBrand = document.createElement('div');
    colBrand.className = 'footer-col footer-col-brand';
    colBrand.append(brand);
    if (globalWrap) colBrand.append(globalWrap);
    if (copyright) colBrand.append(copyright);
    const colNav = document.createElement('div');
    colNav.className = 'footer-col footer-col-nav';
    colNav.append(linksWrapper);
    if (legalList) colNav.append(legalList);
    grid.append(colBrand, colNav);
    footer.textContent = '';
    footer.append(grid);
  }

  block.append(footer);
}

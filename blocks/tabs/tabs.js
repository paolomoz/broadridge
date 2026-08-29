/* tabs — Figma web kit M9 Top Tabber (set 492:53960) and M8 Side Tabber
   (set 800:291230, variant `tabs (side)`). Shared atoms: A18 Tabs
   Horizontal (states 125:1182) and A19 Tabs Vertical (states 504:58415).
   Desktop renders the tablist; at Tablet/Mobile BOTH modules collapse to
   the kit's A1 Accordion presentation (M9 511:93846 / 800:291238), so
   each panel gets an accordion header that mirrors the tab state.
   Kit tab-count rules: horizontal 3-8 (.HorizontalTabCount 128:2206),
   vertical 2-10 (.VerticalTabCount 504:58624), M8 usage min 3 / max 7
   (2190:656939) — authoring guidance, decorated defensively either way.
   Motion (prototype boards 5120:145253 / 1212:89398): tab switch and
   accordion expand run at motion.duration.medium4 (400ms) with
   motion.easing.standard.decelerate; animated props content.frame
   opacity / y-position / expand.height, icon.rotate.45, color.content.
   All transitions live in tabs.css on --motion-* tokens behind a
   .tabs-motion class added on first interaction (no load-time motion)
   and are disabled under prefers-reduced-motion.
   Keyboard/ARIA model (roles, roving tabindex, Arrow/Home/End keys,
   aria-expanded accordion buttons) is derived from the ARIA APG tabs
   and accordion patterns — not documented by the kit. */

/* Arrows / Arrow Right, 24px (kit icon 24:702; size icon/md) */
const ICON_ARROW = `<svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0537 7.33721L8.19357 4.47924C7.92691 4.21277 7.92691 3.79308 8.19291 3.53327C8.45291 3.2668 8.87291 3.2668 9.13957 3.5326L13.1396 7.52964C13.3069 7.69252 13.3665 7.92711 13.3185 8.1429C13.2843 8.302 13.1927 8.44047 13.0666 8.53545L9.13303 12.4661C9.00636 12.5861 8.83303 12.6593 8.6597 12.6593L8.66636 12.6667C8.48636 12.6667 8.31303 12.5934 8.19303 12.4735C7.92636 12.2137 7.92636 11.7873 8.18636 11.5275V11.5208L11.0398 8.66955H3.33333C2.96 8.66955 2.66667 8.36978 2.66667 8.00338C2.66667 7.63032 2.96 7.33721 3.33333 7.33721H11.0537Z" fill="currentColor"/>
</svg>`;

/* System / Open plus — rotates 45° to the kit System / Close X when the
   accordion expands (prototype icon.rotate.45, 5120:145253) */
const ICON_PLUS = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12 4.5v15M4.5 12h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

let blockIndex = 0;

/* panel links render as A12 Link (label + 24px arrow, gap 10 —
   I504:57252;714:400063;2712:438048), never as buttons */
function decorateLinks(panel) {
  panel.querySelectorAll('a').forEach((a) => {
    // links inside headings are panel titles, not A12 links — leave them
    if (a.closest('h1, h2, h3, h4, h5, h6')) return;
    a.classList.remove('button', 'primary', 'secondary');
    a.classList.add('tabs-link');
    const strong = a.closest('strong, em');
    if (strong && strong.parentElement) strong.replaceWith(a);
    // unwrap the aem.js button paragraph so the link is a flex child of
    // the copy column (the kit A9 gap/margins apply to the link itself);
    // only <p> wrappers — never the .tabs-copy column itself
    const wrapper = a.closest('p');
    if (wrapper && wrapper !== panel && wrapper.textContent.trim() === a.textContent.trim()
      && !wrapper.querySelector('picture')) {
      wrapper.replaceWith(a);
    }
    if (!a.textContent.trim()) a.classList.add('tabs-link-icon');
    a.insertAdjacentHTML('beforeend', ICON_ARROW);
  });
}

function decoratePanel(cell) {
  const panel = cell;
  panel.classList.add('tabs-panel');
  // media-led cells get their whole content wrapped in one <p> by
  // aem.js wrapTextNodes — unwrap it back to block-level children
  const wrapper = panel.firstElementChild;
  if (panel.children.length === 1 && wrapper && wrapper.tagName === 'P'
    && wrapper.querySelector('picture, h1, h2, h3, h4, p, ul, ol')) {
    wrapper.replaceWith(...wrapper.childNodes);
  }
  // unwrap aem.js picture paragraphs; media leads the panel
  const picture = panel.querySelector('picture');
  if (picture) {
    const p = picture.closest('p');
    panel.classList.add('has-media');
    panel.prepend(picture);
    if (p && !p.textContent.trim()) p.remove();
  }
  // group the text content so media + copy can be laid out as kit columns
  const copy = document.createElement('div');
  copy.className = 'tabs-copy';
  [...panel.children].filter((el) => el !== picture).forEach((el) => copy.append(el));
  panel.append(copy);
  // defensive (real content): panels authored as a lone title-link
  // (h3 > a, no other link) still get the kit A7 panel anatomy — the
  // heading keeps its text as the card title, the link moves to the
  // card foot as the A12 link inside the padding
  if (copy.querySelectorAll('a').length === 1) {
    const heading = copy.querySelector('h1, h2, h3, h4, h5, h6');
    const a = heading && heading.querySelector('a');
    if (a && heading.textContent.trim() === a.textContent.trim()) {
      const label = a.textContent.trim();
      const foot = document.createElement('p');
      foot.append(a);
      heading.textContent = label;
      copy.append(foot);
    }
  }
  decorateLinks(panel);
  return panel;
}

export default function decorate(block) {
  const isSide = block.classList.contains('side');
  blockIndex += 1;
  const prefix = `tabs-${blockIndex}`;

  const items = [];
  let header = null;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    // header row (A9 Content Groups): heading in the first cell
    if (cells[0] && cells[0].querySelector('h1, h2, h3, h4') && !header) {
      row.classList.add('tabs-header');
      header = row;
      return;
    }
    if (!row.textContent.trim() && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    const label = cells[0] ? cells[0].textContent.trim() : `Tab ${items.length + 1}`;
    const panelCell = cells[1] || document.createElement('div');
    items.push({ label, panelCell });
    row.remove();
  });

  const list = document.createElement('ul');
  list.className = 'tabs-list';
  list.setAttribute('role', 'tablist');
  if (isSide) list.setAttribute('aria-orientation', 'vertical');

  const panels = document.createElement('div');
  panels.className = 'tabs-panels';

  const tabs = [];
  const built = items.map((item, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${prefix}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${prefix}-panel-${i}`);
    tab.innerHTML = `<span class="tabs-label"></span>${isSide ? `<span class="tabs-tab-arrow">${ICON_ARROW}</span>` : ''}`;
    tab.querySelector('.tabs-label').textContent = item.label;
    const li = document.createElement('li');
    li.setAttribute('role', 'presentation');
    li.append(tab);
    list.append(li);
    tabs.push(tab);

    const panel = decoratePanel(item.panelCell);
    panel.id = `${prefix}-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);

    const wrap = document.createElement('div');
    wrap.className = 'tabs-item';
    const accordion = document.createElement('button');
    accordion.type = 'button';
    accordion.className = 'tabs-accordion';
    accordion.setAttribute('aria-controls', panel.id);
    accordion.innerHTML = `<span class="tabs-label"></span><span class="tabs-accordion-icon">${ICON_PLUS}</span>`;
    accordion.querySelector('.tabs-label').textContent = item.label;
    const collapse = document.createElement('div');
    collapse.className = 'tabs-collapse';
    const inner = document.createElement('div');
    inner.className = 'tabs-collapse-inner';
    inner.append(panel);
    collapse.append(inner);
    wrap.append(accordion, collapse);
    panels.append(wrap);
    return { tab, accordion, wrap };
  });

  // body wrapper = the kit's list+content frame (M8 "Capabilities
  // list" 800:291233); keeps the side grid independent of the header
  const body = document.createElement('div');
  body.className = 'tabs-body';
  body.append(list, panels);
  block.append(body);

  let selected = 0;
  const sync = (open) => {
    built.forEach(({ tab, accordion, wrap }, i) => {
      const isSelected = i === selected;
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tab.tabIndex = isSelected ? 0 : -1;
      const isOpen = isSelected && open;
      accordion.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      wrap.classList.toggle('open', isOpen);
    });
  };
  let accordionOpen = true;
  const select = (i, { focus = false } = {}) => {
    selected = i;
    accordionOpen = true;
    sync(true);
    if (focus) tabs[i].focus();
  };

  const enableMotion = () => block.classList.add('tabs-motion');

  built.forEach(({ tab, accordion }, i) => {
    tab.addEventListener('click', () => {
      enableMotion();
      select(i);
    });
    accordion.addEventListener('click', () => {
      enableMotion();
      if (i === selected && accordionOpen) {
        // accordion contract (prototype 5120:145253): the open panel can
        // collapse; tab selection is retained for the desktop layout
        accordionOpen = false;
        sync(false);
      } else {
        select(i);
      }
    });
  });

  // roving tabindex + arrow keys (ARIA APG, derived — not kit-documented)
  list.addEventListener('keydown', (e) => {
    const prevKeys = ['ArrowLeft', 'ArrowUp'];
    const nextKeys = ['ArrowRight', 'ArrowDown'];
    let target = null;
    if (prevKeys.includes(e.key)) target = (selected - 1 + tabs.length) % tabs.length;
    else if (nextKeys.includes(e.key)) target = (selected + 1) % tabs.length;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = tabs.length - 1;
    if (target !== null) {
      e.preventDefault();
      enableMotion();
      select(target, { focus: true });
    }
  });

  // returning to desktop with everything collapsed re-opens the selection
  const desktop = window.matchMedia('(min-width: 1140px)');
  desktop.addEventListener('change', (e) => {
    if (e.matches && !accordionOpen) select(selected);
  });

  select(0);
  block.classList.remove('tabs-motion'); // no load-time motion
}

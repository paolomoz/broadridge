/*
 * .N2 Footer Core (2061:198183). Authoring: one row of column cells;
 * a cell whose first element is a bold heading starts a group,
 * heading-less cells continue the previous group's link list.
 * D and T (2061:198182): three columns, space-between.
 * Mobile (2061:198180/198179/198390): accordion — headings toggle
 * their group's links (Closed / Open / Half Open kit states).
 */

const MQ = window.matchMedia('(width >= 834px)');

export default function decorate(block) {
  const cols = [...block.querySelectorAll(':scope > div > div')];
  const groups = [];
  cols.forEach((col) => {
    col.classList.add('footer-links-col');
    const first = col.firstElementChild;
    const heading = first && first.matches('p') && first.querySelector('strong') ? first : null;
    if (heading) {
      heading.classList.add('footer-links-heading');
      groups.push({ heading, cols: [col] });
    } else if (groups.length) {
      col.classList.add('footer-links-col-cont');
      groups[groups.length - 1].cols.push(col);
    }
  });

  groups.forEach((group) => {
    // accordion toggle (Accordion open heading, 2055:197284)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'footer-links-toggle';
    while (group.heading.firstChild) btn.append(group.heading.firstChild);
    const icon = document.createElement('span');
    icon.className = 'footer-links-toggle-icon';
    btn.append(icon);
    group.heading.append(btn);

    // wrap lists so the mobile open/close can animate (0fr -> 1fr)
    group.cols.forEach((col) => {
      col.querySelectorAll(':scope > ul').forEach((ul) => {
        const panel = document.createElement('div');
        panel.className = 'footer-links-panel';
        const inner = document.createElement('div');
        inner.className = 'footer-links-panel-inner';
        ul.replaceWith(panel);
        inner.append(ul);
        panel.append(inner);
      });
    });

    btn.addEventListener('click', () => {
      if (MQ.matches) return;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      group.cols.forEach((col) => col.classList.toggle('open', !open));
    });
  });

  // the toggles are interactive on mobile only
  const sync = () => {
    groups.forEach(({ heading, cols: groupCols }) => {
      const btn = heading.querySelector('button');
      if (MQ.matches) {
        btn.removeAttribute('aria-expanded');
        btn.setAttribute('tabindex', '-1');
        groupCols.forEach((col) => col.classList.remove('open'));
      } else {
        btn.removeAttribute('tabindex');
        if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
      }
    });
  };
  MQ.addEventListener('change', sync);
  sync();
}

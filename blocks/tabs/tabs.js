export default function decorate(block) {
  const isSide = block.classList.contains('side');
  const rows = [...block.children];
  const list = document.createElement('ul');
  list.className = 'tabs-list';
  list.setAttribute('role', 'tablist');
  const panels = [];
  rows.forEach((row, i) => {
    const cells = [...row.children];
    const label = cells[0]?.textContent.trim() || `Tab ${i + 1}`;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.id = `tab-${i}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', `tabpanel-${i}`);
    btn.textContent = label;
    li.append(btn);
    list.append(li);
    const panel = document.createElement('div');
    panel.id = `tabpanel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${i}`);
    if (i > 0) panel.hidden = true;
    if (cells[1]) panel.append(...cells[1].childNodes);
    else if (cells[0].querySelector('a')) panel.append(cells[0].querySelector('a').cloneNode(true));
    panels.push(panel);
    btn.addEventListener('click', () => {
      list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      panels.forEach((p) => { p.hidden = true; });
      panel.hidden = false;
    });
    row.remove();
  });
  block.append(list, ...(isSide ? [Object.assign(document.createElement('div'), { className: 'tabs-panels' })] : []));
  if (isSide) {
    block.querySelector('.tabs-panels').append(...panels);
  } else {
    block.append(...panels);
  }
}

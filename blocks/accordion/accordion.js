export default function decorate(block) {
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1];
    const details = document.createElement('details');
    details.className = 'accordion-item';
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'accordion-item-body';
    if (body) bodyDiv.append(...body.childNodes);
    details.append(summary, bodyDiv);
    row.replaceWith(details);
  });
}

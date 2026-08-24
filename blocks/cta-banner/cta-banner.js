export default function decorate(block) {
  // second cell links render as buttons
  const row = block.firstElementChild;
  if (!row) return;
  const ctaCell = row.children[1];
  if (ctaCell) {
    ctaCell.querySelectorAll('a').forEach((a) => a.classList.add('button'));
  }
}

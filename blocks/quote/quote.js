/* quote — Figma web kit M7 Testimonials (set 617:61251).
   Authored cells (any row split) classify by content, preserving the
   existing author contract (quote cell first, attribution cell last):
   - a cell with a picture -> quote-media (A13: Large Image photo for
     `quote (image)`, 128px circle avatar for the Simple style)
   - the first text cell -> quote-text (Functional/Quote ramp)
   - the next text cell -> quote-meta (name + job title, 617:59769)
   - a cell whose only content is a plain link -> quote-cta (A12 Link)
   The decorator rebuilds the kit structure: Media + Content, with
   Content = (Quote + Meta Data) + A12 Link (617:59766). */

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  let media = null;
  let text = null;
  let meta = null;
  let cta = null;

  cells.forEach((cell) => {
    if (!media && cell.querySelector('picture, img')) {
      media = cell;
      return;
    }
    const a = cell.querySelector('p > a[href]:only-child') || cell.querySelector(':scope > a[href]:only-child');
    if (!cta && a && cell.textContent.trim() === a.textContent.trim()) {
      cta = cell;
      return;
    }
    if (!text) {
      text = cell;
      return;
    }
    if (!meta) meta = cell;
  });

  const content = document.createElement('div');
  content.className = 'quote-content';

  const body = document.createElement('div');
  body.className = 'quote-body';
  if (text) {
    text.className = 'quote-text';
    body.append(text);
  }
  if (meta) {
    meta.className = 'quote-meta';
    body.append(meta);
  }
  content.append(body);

  if (cta) {
    cta.className = 'quote-cta';
    cta.querySelectorAll('a').forEach((a) => a.classList.add('cta-link'));
    content.append(cta);
  }

  const children = [];
  if (media) {
    media.className = 'quote-media';
    children.push(media);
  }
  children.push(content);
  block.replaceChildren(...children);
}

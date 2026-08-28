/* anchor-banner — Figma web kit B4 Anchor Banner (set 2345:17429).
 *
 * AUTHORING CONTRACT
 *   | anchor-banner |
 *   | :--- | :--- |
 *   | (eyebrow p) heading, body | picture |
 *
 * Rows are content cell(s) plus one picture cell. The picture cell is
 * the cell whose only content is a <picture> (no text). Authors may put
 * both cells on one row or split them across single-cell rows; extra
 * content cells merge into the first, defensively.
 *
 * Image placement (kit axis Image Placement Right/Left):
 *   - picture cell authored AFTER the content = image right (default,
 *     2345:17428 / 2345:36828);
 *   - picture cell authored BEFORE the content = image left
 *     (2345:37005 / 2345:19314), equivalent to the block variant class
 *     `anchor-banner (image-left)`, which wins over authored order.
 *   Stacked (2345:25790) is the kit's Mobile-only behavior — image on
 *   top regardless of placement — handled in CSS, never a class.
 *
 * Eyebrow (kit Show Eyebrow Label boolean, Specs 3249:435257): the
 * first <p> before the heading in the content cell. Authored in normal
 * case; CSS uppercases it (kit specimen "EYEBROW TEXT", 2345:14141).
 *
 * Decorated shape (DOM order is always content, media; CSS flips the
 * visual order for image-left / stacked):
 *   .anchor-banner > div > div.anchor-banner-content (+ .anchor-banner-eyebrow p)
 *                        > div.anchor-banner-media > picture
 */

export default function decorate(block) {
  const cells = [...block.children].flatMap((row) => [...row.children]);
  let media = null;
  let content = null;
  let mediaAuthoredFirst = false;

  cells.forEach((cell) => {
    if (!media && cell.querySelector('picture') && !cell.textContent.trim()) {
      media = cell;
      if (!content) mediaAuthoredFirst = true;
    } else if (!content) {
      content = cell;
    } else {
      // defensive: authors add cells — merge extra content cells
      content.append(...cell.childNodes);
    }
  });

  if (!content) content = document.createElement('div');
  content.classList.add('anchor-banner-content');

  // eyebrow: leading <p> before the first heading
  const first = content.firstElementChild;
  if (first && first.tagName === 'P' && content.querySelector('h1, h2, h3, h4, h5, h6')) {
    first.classList.add('anchor-banner-eyebrow');
  }

  const row = document.createElement('div');
  row.append(content);
  if (media) {
    media.classList.add('anchor-banner-media');
    row.append(media);
    if (mediaAuthoredFirst) block.classList.add('image-left');
  }
  block.replaceChildren(row);
}

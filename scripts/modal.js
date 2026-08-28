/*
 * modal — Figma web kit F2 Modals shared component
 * (F2A Modals set 2187:149104, F2B Modals set 2425:164792).
 *
 * Loaded on demand by consumers; nothing here runs at page load:
 *
 *   const { openModal } = await import(`${window.hlx.codeBasePath}/scripts/modal.js`);
 *   const modal = await openModal(contentElOrUrl, {
 *     variant: 'f2a',        // 'f2a' (profile/bio, 2187:149105) or
 *                            // 'f2b' (callout window + form, 2425:164795)
 *     label: 'Profile',      // accessible name for the dialog
 *     onClose: () => {},     // called once after the dialog closes
 *   });
 *   modal.dialog             // the <dialog class="modal modal-f2a"> element
 *   modal.close()            // programmatic close
 *
 * Content argument:
 *   - HTMLElement: moved into the dialog's .modal-content container
 *     (move — not clone — so live listeners/forms keep working).
 *   - string URL (same-origin): fetched; the response's <body> children
 *     (or `.plain.html` fragment) are injected undecorated.
 *
 * Close affordances (kit Close Modal icon button, System/Close 24:698):
 *   - the close icon button (top corner, aria-label "Close")
 *   - the Escape key (native <dialog> cancel)
 *   - a click on the backdrop (outside the dialog box)
 * Focus handling: <dialog>.showModal() provides the focus trap and makes
 * the rest of the page inert; focus starts on the close button and is
 * restored to the opener by the platform when the dialog closes.
 * (Trap/Escape/initial-focus semantics are derived from the ARIA dialog
 * pattern — the kit documents only the visual anatomy.)
 *
 * Styling lives in /styles/modal.css, loaded (once) by openModal.
 * Consumers style their own content; the profile-bio (F2A) and callout
 * (F2B) content layouts ship as .modal-profile / .modal-callout classes.
 */

import { loadCSS } from './aem.js';

/* System / Close (24:698) */
const CLOSE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M17.2929 5.29289C17.6834 4.90237 18.3164 4.90237 18.707 5.29289C19.0674 5.65338 19.095 6.22091 18.79 6.61321L18.707 6.70696L13.414 11.9999L18.707 17.2929C19.0975 17.6834 19.0975 18.3164 18.707 18.707C18.3465 19.0674 17.7789 19.095 17.3866 18.79L17.2929 18.707L11.9999 13.414L6.70696 18.707C6.31643 19.0975 5.68342 19.0975 5.29289 18.707C4.93241 18.3465 4.90486 17.7789 5.20989 17.3866L5.29289 17.2929L10.5859 11.9999L5.29289 6.70696C4.90237 6.31643 4.90237 5.68342 5.29289 5.29289C5.65338 4.93241 6.22091 4.90486 6.61321 5.20989L6.70696 5.29289L11.9999 10.5859L17.2929 5.29289Z" fill="currentColor"/>
</svg>`;

async function resolveContent(content) {
  if (content instanceof DocumentFragment) return [...content.children];
  if (content instanceof HTMLElement) return [content];
  const resp = await fetch(String(content));
  if (!resp.ok) throw new Error(`modal content fetch failed: ${resp.status}`);
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  return [...doc.body.children];
}

/**
 * Opens a modal dialog styled to the kit's F2 anatomy.
 * @param {HTMLElement|string} content element to move in, or a URL to fetch
 * @param {{variant?: 'f2a'|'f2b', label?: string, onClose?: Function}} [options]
 * @returns {Promise<{dialog: HTMLDialogElement, close: Function}>}
 */
export async function openModal(content, { variant = 'f2a', label, onClose } = {}) {
  await loadCSS(`${window.hlx?.codeBasePath || ''}/styles/modal.css`);

  const dialog = document.createElement('dialog');
  dialog.className = `modal modal-${variant === 'f2b' ? 'f2b' : 'f2a'}`;
  if (label) dialog.setAttribute('aria-label', label);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'modal-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.innerHTML = CLOSE_ICON;

  const container = document.createElement('div');
  container.className = 'modal-content';
  container.append(...await resolveContent(content));

  dialog.append(closeButton, container);
  document.body.append(dialog);

  const close = () => dialog.close();
  closeButton.addEventListener('click', close);
  // backdrop click: the dialog element itself is the event target only
  // when the click lands outside the dialog's box (on ::backdrop)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.removeProperty('overflow');
    dialog.remove();
    onClose?.();
  }, { once: true });

  document.body.style.overflow = 'hidden'; /* page scroll parks while open */
  dialog.showModal();
  closeButton.focus();

  return { dialog, close };
}

export default openModal;

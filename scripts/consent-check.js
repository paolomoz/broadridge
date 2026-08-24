/*
 * Broadridge consent replica — mirrors the source site's Google Consent Mode v2
 * setup (defaults denied) and cookie banner (Accept all / Reject all / Customize).
 * Choice persists in localStorage('br-consent'); GTM loads with consent-mode
 * defaults exactly like the source; granular tags fire only after 'update'.
 */
const STORAGE_KEY = 'br-consent';

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }

// source-identical defaults
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
});

function applyConsent(granted) {
  gtag('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    functionality_storage: granted ? 'granted' : 'denied',
    personalization_storage: granted ? 'granted' : 'denied',
  });
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented: granted } }));
  if (granted) import('./consented.js');
}

function banner() {
  const el = document.createElement('div');
  el.className = 'consent-banner';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Cookie consent');
  el.innerHTML = `
    <p>By clicking "Accept all cookies", you agree to the storing of cookies on your device to enhance
    site navigation, analyze site usage, and assist in our marketing efforts.
    <a href="/legal/privacy-statement-english">Cookie Notice</a></p>
    <div class="consent-actions">
      <button class="button" data-consent="accept">Accept all cookies</button>
      <button class="button secondary" data-consent="reject">Reject all</button>
    </div>`;
  el.addEventListener('click', (e) => {
    const choice = e.target.dataset?.consent;
    if (!choice) return;
    localStorage.setItem(STORAGE_KEY, choice);
    applyConsent(choice === 'accept');
    el.remove();
  });
  const style = document.createElement('style');
  style.textContent = `
    .consent-banner { position: fixed; inset: auto 16px 16px; z-index: 100; max-width: 720px;
      margin: 0 auto; background: var(--c-white, #fff); border-radius: 2px;
      box-shadow: 0 4px 8px rgb(0 0 0 / 20%); padding: 20px 24px; font-size: 14px; }
    .consent-banner .consent-actions { display: flex; gap: 12px; }
    .consent-banner .button { margin: 0; padding: 12px 20px; font-size: 14px; }`;
  document.head.append(style);
  document.body.append(el);
}

// GTM loads always (consent-mode gated), like the source
(function loadGTM() {
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-PW7DJ8';
  document.head.append(s);
}());

const stored = localStorage.getItem(STORAGE_KEY);
if (stored) {
  applyConsent(stored === 'accept');
} else {
  banner();
}

/*
 * /test-b review copy — template-gated form parity enhancements.
 * Runs ONLY when page metadata template = test-b (see scripts.js loadEager).
 * Adds the live form's placeholders / required marks / disclaimer, which the
 * shared form block does not render. No shared code or block is modified.
 */
const PLACEHOLDERS = {
  firstname: 'First name',
  lastname: 'Last name',
  email: 'name@email.com',
  phone: '+1 _ _ _ - _ _ _ - _ _ _ _',
  jobtitle: 'Job title',
  company: 'Your company name',
  message: 'Please describe your request so we can better address your inquiry',
};

function enhanceForm(form) {
  Object.entries(PLACEHOLDERS).forEach(([name, ph]) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.placeholder = ph;
  });
  // live marks phone + job title required too
  ['phone', 'jobtitle'].forEach((name) => {
    const el = form.querySelector(`[name="${name}"]`);
    const label = el && form.querySelector(`label[for="${el.id}"]`);
    if (label && !label.querySelector('.req')) {
      const req = document.createElement('span');
      req.className = 'req';
      req.textContent = ' *';
      label.append(req);
    }
  });
  // the message label carries a literal " *" plus the injected req span — dedupe
  const msgLabel = form.querySelector('label[for="f-message"]');
  if (msgLabel && msgLabel.childNodes[0]) {
    msgLabel.childNodes[0].textContent = msgLabel.childNodes[0].textContent.replace(/\s*\*\s*$/, '');
  }
  const submit = form.querySelector('button[type="submit"]');
  if (submit && !form.querySelector('.test-b-disclaimer')) {
    const d = document.createElement('div');
    d.className = 'test-b-disclaimer';
    d.innerHTML = 'By proceeding, you agree that Broadridge can use your personal information to respond to your inquiry and send you occasional updates about Broadridge solutions and thought leadership. You can unsubscribe from our communications at any time. To learn more, view our <a href="/legal/privacy-statement-english">Privacy Statement</a>.';
    submit.after(d);
  }
}

function fixHeroHeading() {
  // live renders the hero title as a plain <h1>; the block emits <h2><a>
  const h2 = document.querySelector('main .hero-carousel.block > div:first-child h2');
  if (!h2 || h2.dataset.testbFixed) return;
  const h1 = document.createElement('h1');
  h1.textContent = h2.textContent.trim();
  h1.className = h2.className;
  h1.dataset.testbFixed = '1';
  h2.replaceWith(h1);
}

function controlsEl(bullets) {
  const c = document.createElement('div');
  c.className = 'test-b-slider-controls';
  c.innerHTML = `<div class="bullets">${'<span></span>'.repeat(bullets)}</div>`
    + '<div class="arrows"><span class="prev"></span><span class="next"></span></div>';
  return c;
}

function addSliderControls() {
  const ins = document.querySelector('main .insights-wrapper');
  if (ins && !ins.querySelector('.test-b-slider-controls')) {
    const slides = ins.querySelectorAll('.insights.block > div').length;
    ins.append(controlsEl(Math.max(4, slides - 3)));
  }
  document.querySelectorAll('main .section.text-slider > .default-content-wrapper').forEach((w) => {
    if (w.querySelector('.test-b-slider-controls')) return;
    w.append(controlsEl(w.querySelectorAll(':scope > p').length));
  });
  document.querySelectorAll('main .section.stats-container > .stats-wrapper').forEach((w) => {
    if (w.querySelector('.test-b-slider-controls')) return;
    w.append(controlsEl(w.querySelectorAll('.stats.block > div').length));
  });
  return !!ins;
}

function addTabActivators() {
  document.querySelectorAll('main .tabs.block:not(.side) .tabs-list').forEach((list) => {
    if (list.querySelector('.testb-activator')) return;
    const bar = document.createElement('span');
    bar.className = 'testb-activator';
    list.append(bar);
    const position = () => {
      const btn = list.querySelector('button[aria-selected="true"]') || list.querySelector('button');
      if (!btn) return;
      const lb = list.getBoundingClientRect();
      const bb = btn.getBoundingClientRect();
      bar.style.left = `${bb.left - lb.left}px`;
      bar.style.width = `${bb.width}px`;
    };
    position();
    list.addEventListener('click', () => setTimeout(position, 0));
    window.addEventListener('resize', position);
  });
}

export default function run() {
  fixHeroHeading();
  addSliderControls();
  addTabActivators();
  const tryEnhance = () => {
    fixHeroHeading();
    addSliderControls();
    addTabActivators();
    const form = document.querySelector('main .form.block form');
    if (form) { enhanceForm(form); return true; }
    return false;
  };
  if (tryEnhance()) return;
  const obs = new MutationObserver(() => { if (tryEnhance()) obs.disconnect(); });
  obs.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 15000);
}

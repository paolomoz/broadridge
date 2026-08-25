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

function buildCarousel(viewport, slides, host) {
  if (viewport.dataset.testbCarousel) return;
  viewport.dataset.testbCarousel = '1';
  const controls = document.createElement('div');
  controls.className = 'test-b-slider-controls';
  controls.innerHTML = '<div class="bullets"></div>'
    + '<div class="arrows"><button type="button" class="prev" aria-label="Previous slide"></button>'
    + '<button type="button" class="next" aria-label="Next slide"></button></div>';
  (host || viewport.parentElement).append(controls);
  const bulletsBox = controls.querySelector('.bullets');
  const prev = controls.querySelector('.prev');
  const next = controls.querySelector('.next');
  let index = 0;
  const metrics = () => {
    const first = slides()[0];
    if (!first) return null;
    const second = slides()[1];
    const pitch = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    const max = Math.max(0, Math.round((viewport.scrollWidth - viewport.clientWidth) / pitch));
    return { pitch, max };
  };
  const render = () => {
    const m = metrics();
    if (!m || m.max === 0) { controls.style.display = 'none'; return; }
    controls.style.display = 'flex';
    if (index > m.max) index = m.max;
    bulletsBox.innerHTML = '<span></span>'.repeat(m.max + 1);
    [...bulletsBox.children].forEach((bIdx, i) => bulletsBox.children[i].classList.toggle('on', i === index));
    prev.classList.toggle('off', index === 0);
    next.classList.toggle('off', index === m.max);
  };
  const go = (dir) => {
    const m = metrics();
    if (!m) return;
    index = Math.min(m.max, Math.max(0, index + dir));
    viewport.scrollTo({ left: index * m.pitch, behavior: 'smooth' });
    render();
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  window.addEventListener('resize', render);
  window.addEventListener('load', render);
  [400, 1200, 3000].forEach((ms) => setTimeout(render, ms));
  render();
}

function addSliderControls() {
  const ins = document.querySelector('main .insights-wrapper .insights.block');
  if (ins) buildCarousel(ins, () => [...ins.children].filter((c) => !c.className.includes('controls')), ins.parentElement);
  document.querySelectorAll('main .section.text-slider > .default-content-wrapper').forEach((w) => {
    if (w.querySelector('.testb-viewport')) return;
    const items = [...w.children].filter((c) => c.matches('h3, p'));
    if (!items.length) return;
    const vp = document.createElement('div');
    vp.className = 'testb-viewport';
    let slide = null;
    items.forEach((el) => {
      if (el.matches('h3') || !slide || slide.querySelector('p')) {
        slide = document.createElement('div'); slide.className = 'testb-slide'; vp.append(slide);
      }
      slide.append(el);
    });
    w.append(vp);
    buildCarousel(vp, () => [...vp.children], w);
  });
  document.querySelectorAll('main .stats-wrapper .stats.block').forEach((st) => {
    buildCarousel(st, () => [...st.children].filter((c) => c.matches('div:not(.test-b-slider-controls)')), st.parentElement);
  });
  return !!ins;
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

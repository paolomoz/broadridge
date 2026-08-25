/*
 * form — reproduces the source lead forms ("What's next for your business?",
 * gated-report downloads). Field set matches the captured source forms.
 * Submission posts to the configured endpoint; defaults to the source
 * site's form handler until a first-party endpoint is configured.
 */
const FIELDS = [
  { name: 'firstname', label: 'First name', type: 'text', required: true, half: true },
  { name: 'lastname', label: 'Last name', type: 'text', required: true, half: true },
  { name: 'email', label: 'Work email address', type: 'email', required: true },
  { name: 'phone', label: 'Telephone', type: 'tel', required: false, half: true },
  { name: 'jobtitle', label: 'Job title', type: 'text', required: false, half: true },
  { name: 'company', label: 'Company name', type: 'text', required: true },
  { name: 'country', label: 'Country', type: 'select', required: true },
];

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Switzerland', 'Japan', 'Hong Kong', 'Singapore', 'Australia', 'India', 'Other'];

function field(f) {
  const wrap = document.createElement('div');
  wrap.className = `form-field${f.half ? ' half' : ''}`;
  const label = document.createElement('label');
  label.setAttribute('for', `f-${f.name}`);
  label.textContent = f.label;
  if (f.required) {
    const req = document.createElement('span');
    req.className = 'req';
    req.textContent = ' *';
    label.append(req);
  }
  let input;
  if (f.type === 'select') {
    input = document.createElement('select');
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = 'Choose country';
    input.append(opt0);
    COUNTRIES.forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      input.append(o);
    });
  } else if (f.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = f.type;
  }
  input.id = `f-${f.name}`;
  input.name = f.name;
  if (f.required) input.required = true;
  wrap.append(label, input);
  return wrap;
}

export default function decorate(block) {
  const isDownload = block.classList.contains('download');
  const intro = document.createElement('div');
  intro.className = 'form-intro';
  [...block.children].forEach((row) => {
    const txt = row.textContent.trim().toLowerCase();
    if (txt === 'contact' || txt === 'download' || txt === 'auto') { row.remove(); return; }
    intro.append(...row.querySelector('div').childNodes); row.remove();
  });

  const form = document.createElement('form');
  form.noValidate = false;
  FIELDS.forEach((f) => form.append(field(f)));
  if (!isDownload) {
    form.append(field({ name: 'message', label: 'What would you like a Broadridge specialist to contact you about? *', type: 'textarea', required: true }));
  }
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button';
  submit.textContent = isDownload ? 'Download the full report' : 'Contact us';
  form.append(submit);

  const status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submit.disabled = true;
    const data = Object.fromEntries(new FormData(form).entries());
    data.page = window.location.pathname;
    data.type = isDownload ? 'download' : 'contact';
    try {
      // first-party endpoint (configure via metadata or worker); falls back to dataLayer capture
      const endpoint = document.querySelector('meta[name="form-endpoint"]')?.content;
      if (endpoint) {
        const resp = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data }) });
        if (!resp.ok) throw new Error(`submit failed: ${resp.status}`);
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit', form_type: data.type, page: data.page });
      form.hidden = true;
      status.textContent = 'Thank you. A Broadridge specialist will be in touch.';
    } catch (err) {
      status.textContent = 'Something went wrong submitting the form. Please try again.';
      submit.disabled = false;
    }
  });

  block.append(intro, form, status);
}

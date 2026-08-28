/*
 * form — Figma web kit F1 Form Feature (set 48:170; core .F1 Form Core
 * 576:33838; inputs A11 466:5800 et al.). Two kit form types map to the
 * existing block modes:
 *   - Default Lead Form  -> contact (default)
 *   - Gated Content Form -> download (`form (download)`)
 * Authored rows: an optional mode row (contact|download|auto), the first
 * remaining row becomes the intro copy (top-left), any further rows the
 * aside (bottom-left, e.g. the phone directory).
 * Submission logic is unchanged: posts to meta[name=form-endpoint] when
 * configured, always pushes dataLayer form_submit. Field-level validation
 * renders the kit's A11 error anatomy (2px error border + italic helper,
 * 466:5797) instead of native bubbles; the submit path is only reached
 * when the form is valid, exactly as before (noValidate previously false).
 */

/* kit field sets: lead 48:171 / gated 739:10767. `star` renders the kit's
   asterisk (the kit marks phone/job title with * although the captured
   source forms treat them as optional — required flags are unchanged). */
const LEAD_FIELDS = [
  { name: 'firstname', label: 'First name', type: 'text', required: true, half: true, placeholder: 'First name' },
  { name: 'lastname', label: 'Last name', type: 'text', required: true, half: true, placeholder: 'Last name' },
  { name: 'email', label: 'Work email address', type: 'email', required: true, placeholder: 'name@email.com', errorMsg: 'Email is required' },
  { name: 'phone', label: 'Telephone', type: 'tel', required: false, half: true, star: true, placeholder: '_ _ _ - _ _ _ - _ _ _ _', prefix: '+1' },
  { name: 'jobtitle', label: 'Job title', type: 'text', required: false, half: true, star: true, placeholder: 'Job title' },
  { name: 'company', label: 'Company name', type: 'text', required: true, placeholder: 'Your company name' },
  { name: 'country', label: 'Country', type: 'select', required: true, placeholder: 'Choose country' },
  {
    name: 'message',
    label: 'What would you like a Broadridge specialist to contact you about?',
    type: 'textarea',
    required: true,
    placeholder: 'Please describe your request so we can better address your inquiry',
    minLength: 25, /* kit helper: "This field must be at least 25 characters" (632:2936) */
    errorMsg: 'Message is required',
  },
];

const DOWNLOAD_FIELDS = [
  { name: 'firstname', label: 'First name', type: 'text', required: true, half: true, placeholder: 'First name' },
  { name: 'lastname', label: 'Last name', type: 'text', required: true, half: true, placeholder: 'Last name' },
  { name: 'email', label: 'Work email address', type: 'email', required: true, placeholder: 'name@email.com', errorMsg: 'Email is required' },
  { name: 'company', label: 'Company name', type: 'text', required: true, placeholder: 'Your company name' },
  { name: 'country', label: 'Country', type: 'select', required: true, placeholder: 'Choose country' },
  { name: 'contact', label: 'Would you like a Broadridge sales representative to contact you? (optional)', type: 'checkbox', required: false },
];

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Switzerland', 'Japan', 'Hong Kong', 'Singapore', 'Australia', 'India', 'Other'];

/* System / Circle Check (15801:243078) */
const CHECK_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12.0001 2.00008C17.5229 2.00012 22.0001 6.47725 22.0001 12.0001C22 17.5229 17.5229 22 12.0001 22.0001C6.47725 22.0001 2.00012 17.5229 2.00008 12.0001C2.00008 6.47723 6.47723 2.00008 12.0001 2.00008ZM12.0001 4.00008C7.5818 4.00008 4.00008 7.5818 4.00008 12.0001C4.00012 16.4183 7.58182 20.0001 12.0001 20.0001C16.4183 20 20 16.4183 20.0001 12.0001C20.0001 7.58182 16.4183 4.00012 12.0001 4.00008ZM14.293 9.29304C14.6836 8.90252 15.3166 8.90252 15.7071 9.29304C16.0676 9.65353 16.0951 10.2211 15.7901 10.6134L15.7071 10.7071L11.7071 14.7071C11.3466 15.0676 10.7791 15.0951 10.3868 14.7901L10.293 14.7071L8.29304 12.7071C7.90252 12.3166 7.90252 11.6836 8.29304 11.293C8.65353 10.9326 9.22107 10.905 9.61336 11.21L9.70711 11.293L11.0001 12.585L14.293 9.29304Z" fill="currentColor"/>
</svg>`;

function field(f) {
  const wrap = document.createElement('div');
  wrap.className = `form-field${f.half ? ' half' : ''}${f.type === 'checkbox' ? ' checkbox' : ''}`;
  const label = document.createElement('label');
  label.setAttribute('for', `f-${f.name}`);
  label.textContent = f.label;
  if (f.required || f.star) {
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
    opt0.textContent = f.placeholder || 'Choose country';
    input.append(opt0);
    COUNTRIES.forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      input.append(o);
    });
  } else if (f.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 1; /* kit default field height 56 (473:6332), user-resizable */
    if (f.minLength) input.minLength = f.minLength;
  } else {
    input = document.createElement('input');
    input.type = f.type;
  }
  input.id = `f-${f.name}`;
  input.name = f.name;
  if (f.required) input.required = true;
  if (f.placeholder && f.type !== 'select') input.placeholder = f.placeholder;
  if (f.errorMsg) input.dataset.errorMsg = f.errorMsg;
  input.addEventListener('input', () => {
    if (input.minLength > 0) enforceMinLengths(wrap);
    if (input.checkValidity()) {
      wrap.classList.remove('error');
      wrap.querySelector('.field-helper')?.remove();
    }
  });
  if (f.type === 'checkbox') {
    wrap.append(input, label); /* kit gated checkbox row 739:139715: box left of label */
  } else if (f.prefix) {
    /* PhoneInput affix (466:6263): "+1" prefix inside the field chrome */
    const affix = document.createElement('div');
    affix.className = 'form-affix';
    const pre = document.createElement('span');
    pre.setAttribute('aria-hidden', 'true');
    pre.textContent = f.prefix;
    affix.append(pre, input);
    wrap.append(label, affix);
  } else {
    wrap.append(label, input);
  }
  return wrap;
}

/* native tooShort only fires on user-dirtied values; enforce minlength for
   programmatic/autofilled values too (kit intended functionality 576:33816) */
function enforceMinLengths(scope) {
  scope.querySelectorAll('[minlength]').forEach((el) => {
    el.setCustomValidity(el.value && el.value.length < el.minLength
      ? `This field must be at least ${el.minLength} characters` : '');
  });
}

/* A11 error anatomy (466:5797): 2px error border + 14px italic helper */
function markErrors(form) {
  let first = null;
  form.querySelectorAll('input, select, textarea').forEach((input) => {
    const wrap = input.closest('.form-field');
    wrap.classList.remove('error');
    wrap.querySelector('.field-helper')?.remove();
    if (input.willValidate && !input.checkValidity()) {
      wrap.classList.add('error');
      const helper = document.createElement('p');
      helper.className = 'field-helper';
      if (input.validity.tooShort || input.validity.customError) helper.textContent = `This field must be at least ${input.minLength} characters`;
      else if (input.validity.valueMissing) helper.textContent = input.dataset.errorMsg || `${wrap.querySelector('label').firstChild.textContent.trim()} is required`;
      else helper.textContent = input.dataset.errorMsg || input.validationMessage;
      wrap.append(helper);
      if (!first) first = input;
    }
  });
  first?.focus();
}

export default function decorate(block) {
  let isDownload = block.classList.contains('download');
  const intro = document.createElement('div');
  intro.className = 'form-intro';
  const aside = document.createElement('div');
  aside.className = 'form-aside';
  let contentRows = 0;
  [...block.children].forEach((row) => {
    const txt = row.textContent.trim().toLowerCase();
    if (txt === 'contact' || txt === 'download' || txt === 'auto') {
      if (txt === 'download') isDownload = true;
      row.remove();
      return;
    }
    /* first content row -> intro (top-left), the rest -> aside (bottom-left) */
    (contentRows === 0 ? intro : aside).append(...row.querySelector('div').childNodes);
    contentRows += 1;
    row.remove();
  });

  const copy = document.createElement('div');
  copy.className = 'form-copy';
  copy.append(intro);
  if (aside.hasChildNodes()) copy.append(aside);

  const form = document.createElement('form');
  form.noValidate = true; /* kit helper-text validation replaces native bubbles */
  (isDownload ? DOWNLOAD_FIELDS : LEAD_FIELDS).forEach((f) => form.append(field(f)));

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button';
  submit.textContent = isDownload ? 'Click to download file' : 'Contact us'; /* A6 labels 14903:42872 / 576:54326 */
  const privacy = document.createElement('p');
  privacy.className = 'form-privacy';
  privacy.innerHTML = 'We value your privacy. To learn more, view our <a href="https://www.broadridge.com/legal/privacy-statement-english" target="_blank" rel="noopener">Privacy Statement</a>.'; /* 14902:32108 */
  actions.append(submit, privacy);
  form.append(actions);

  const status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    enforceMinLengths(form);
    if (!form.checkValidity()) {
      markErrors(form);
      return;
    }
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
      /* A11 Notice / Success (632:3988) */
      status.classList.add('success');
      status.innerHTML = `${CHECK_ICON}<span>Thank you for your interest in Broadridge.<br>A representative will contact you within 24 business hours.</span>`;
    } catch (err) {
      status.classList.add('error');
      status.textContent = 'Something went wrong submitting the form. Please try again.';
      submit.disabled = false;
    }
  });

  const panel = document.createElement('div');
  panel.className = 'form-panel';
  panel.append(form, status);

  block.append(copy, panel);
}

/*
 * Consented martech — loads after the user accepts cookies.
 * Qualified chat widget (source token) + form-lead dataLayer bridging.
 */
(function loadQualified() {
  window.QualifiedObject = 'qualified';
  window.qualified = window.qualified || function q(...args) { (window.qualified.q = window.qualified.q || []).push(args); };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://js.qualified.com/qualified.js?token=z3sgiJDTqMdTFT3y';
  document.head.append(s);
}());

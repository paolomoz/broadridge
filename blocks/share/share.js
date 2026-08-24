/* share row — reproduces the source article share affordance */
const NETWORKS = [
  ['X', (u) => `https://twitter.com/intent/tweet?url=${u}`],
  ['LinkedIn', (u) => `https://www.linkedin.com/shareArticle?mini=true&url=${u}`],
  ['Facebook', (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`],
  ['Email', (u) => `mailto:?body=${u}`],
];

export default function decorate(block) {
  block.textContent = '';
  const label = document.createElement('span');
  label.className = 'share-label';
  label.textContent = document.documentElement.lang === 'ja' ? 'シェアする' : 'Share';
  const ul = document.createElement('ul');
  const pageUrl = encodeURIComponent(window.location.href);
  NETWORKS.forEach(([name, fn]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = fn(pageUrl);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = name;
    a.setAttribute('aria-label', `Share on ${name}`);
    li.append(a);
    ul.append(li);
  });
  block.append(label, ul);
}

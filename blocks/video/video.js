/* video — reproduces source Vimeo iframes / mp4 heroes with click-to-load facade */
export default function decorate(block) {
  const a = block.querySelector('a');
  if (!a) return;
  const url = a.href;
  block.textContent = '';
  const isVimeo = url.includes('vimeo.com');
  const wrapper = document.createElement('div');
  wrapper.className = 'video-frame';
  if (isVimeo || url.includes('youtube')) {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'Video');
    iframe.loading = 'lazy';
    wrapper.append(iframe);
  } else {
    const videoEl = document.createElement('video');
    videoEl.controls = true;
    videoEl.preload = 'metadata';
    const src = document.createElement('source');
    src.src = url;
    videoEl.append(src);
    wrapper.append(videoEl);
  }
  block.append(wrapper);
}

export default function decorate(block) {
  // slides are static grid panels (main + promos); links inside h2 stay links
  block.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
}

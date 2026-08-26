// Batch driver for extract --prep full-inventory crawl.
// Skips already-captured slugs, runs crawl.mjs in batches, merges logs.
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const urls = JSON.parse(readFileSync('stardust/inventory-resolved.json', 'utf8'));
const slugify = (u) => {
  const p = new URL(u).pathname.replace(/^\/|\/$/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  return p || 'index';
};
const pending = urls.filter((u) => !existsSync(`stardust/current/pages/${slugify(u)}.json`));
console.log(`[driver] ${urls.length} total, ${urls.length - pending.length} already captured, ${pending.length} pending`);

const BATCH = 100;
for (let i = 0; i < pending.length; i += BATCH) {
  const batch = pending.slice(i, i + BATCH);
  const t0 = Date.now();
  console.log(`[driver] batch ${1 + i / BATCH}/${Math.ceil(pending.length / BATCH)} (${batch.length} pages)`);
  try {
    execFileSync('node', ['stardust/scripts/crawl.mjs',
      '--url', batch[0],
      '--pages', batch.join(','),
      '--max', String(BATCH + 5),
      '--wait', 'medium',
      '--concurrency', '8',
      '--out', 'stardust/current'], { stdio: ['ignore', 'inherit', 'inherit'], timeout: 30 * 60 * 1000 });
  } catch (e) {
    console.error(`[driver] batch ${1 + i / BATCH} FAILED: ${e.message} — continuing`);
  }
  // merge this batch's crawl log into the cumulative jsonl
  try {
    const log = readFileSync('stardust/current/_crawl-log.json', 'utf8');
    appendFileSync('stardust/current/_crawl-log-batches.jsonl', JSON.stringify({ batch: 1 + i / BATCH, at: new Date().toISOString(), tookMs: Date.now() - t0, log: JSON.parse(log) }) + '\n');
  } catch { }
  console.log(`[driver] batch done in ${Math.round((Date.now() - t0) / 1000)}s`);
}
console.log('[driver] all batches complete');

import { chromium } from 'playwright';
const urls = process.argv.slice(2);
const b = await chromium.launch();
for (const url of urls) {
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await pg.waitForTimeout(2500);
  for (const s of ['#onetrust-accept-btn-handler', 'button:has-text("Accept all")']) {
    const el = await pg.$(s); if (el) { await el.click().catch(() => {}); break; }
  }
  await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await pg.waitForTimeout(800);
  const data = await pg.evaluate(() => {
    const secs = [...document.querySelectorAll('main > section, main > .section, main > div.section')];
    return secs.map((s) => {
      const cs = getComputedStyle(s);
      const r = s.getBoundingClientRect();
      return { cls: s.className.slice(0, 50), h: Math.round(r.height), pt: cs.paddingTop, pb: cs.paddingBottom, label: (s.querySelector('h1,h2,h3')?.textContent || '').trim().slice(0, 30) };
    });
  });
  console.log('==', url);
  data.forEach((d) => console.log(`  h=${String(d.h).padStart(5)} pt=${d.pt.padStart(6)} pb=${d.pb.padStart(6)}  ${d.label} [${d.cls}]`));
  await pg.close();
}
await b.close();

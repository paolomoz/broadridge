#!/usr/bin/env python3
"""extract --prep post-pass: page typing, typed slots, module-candidate
detection, provenance validation, prep summary. Runs after crawl-all.mjs."""
import json, glob, os, re, sys, hashlib
from collections import Counter, defaultdict
from urllib.parse import urlsplit

PAGES_DIR = 'stardust/current/pages'
NOW = '2026-08-24T15:00:00Z'  # stamped by driver

# ---- page typing (URL-pattern + shape judgment) ----
ARTICLE_PREFIXES = ('insights/', 'article/', 'press-release/', 'white-paper/', 'report/',
                    'case-study/', 'podcast/', 'video/', 'webinar/', 'infographic/', 'ebook/',
                    'fact-sheet/', 'award/', 'announcements/', 'resource/', 'insight-pages/',
                    'proxypulse/', 'jp/news/', 'jp/insights/', 'jp/article/', 'de/insights/',
                    'de/artikel/', 'de/pressemitteilung/', 'de/press-release/')
LISTING_EXACT = {'news-room', 'press-hub', 'broadridge-insights', 'all-products', 'sitemap',
                 'jp/news-room', 'de/news-room', 'insights', 'jp/insights-index'}
FORM_EXACT = {'contact-us', 'trading-and-connectivity-contact', 'jp/contact', 'de/contact', 'de/kontakt', 'cit/contact'}
STATIC_PREFIXES = ('legal/', 'jp/legal/', 'de/legal/', 'de/rechtliches/')
UNIQUE_EXACT = {'index', '', 'future', 'wealth-interactive-presentation', 'our-leadership-team',
                'de', 'jp', 'cit'}

def type_of(path, rec):
    p = path.strip('/')
    if p in UNIQUE_EXACT: return 'unique' if p not in ('',) else 'landing'
    if p in FORM_EXACT: return 'form'
    if p in LISTING_EXACT: return 'listing'
    if p.startswith(STATIC_PREFIXES): return 'static'
    if p.startswith(ARTICLE_PREFIXES): return 'article'
    if p.startswith(('capability/', 'jp/capability/', 'de/capability/', 'de/loesungen/', 'cit/')): return 'program'
    if p.startswith(('who-we-serve/', 'jp/who-we-serve/', 'de/who-we-serve/', 'about', 'jp/about', 'de/about',
                     'campaign/', 'campaigns/', 'hub/', 'artificial-intelligence', 'edgar-next',
                     'securities-litigation', 'security-capabilities', 'consulting-services',
                     'financial-services/', 'customer-communications')): return 'landing'
    # shape fallback: form-heavy -> form; many links few paragraphs -> listing; long body -> article
    if rec:
        body = rec.get('body') or []
        heads = rec.get('headings') or []
        if len(body) > 14 and len(heads) <= 8: return 'article'
    return 'landing'

# ---- typed slots per page-type ----
def slots_for(ptype, rec):
    heads = rec.get('headings') or []
    body = rec.get('body') or []
    media = rec.get('media') or {}
    imgs = media.get('imgs') or []
    h1 = next((h['text'] for h in heads if h.get('tag') == 'h1'), None)
    lead_img = next((i.get('src') for i in imgs if (i.get('w') or 0) >= 400), None)
    common = {'headline': h1, 'meta': {'title': rec.get('title'), 'description': rec.get('description')}}
    if ptype == 'article':
        return {**common, 'lead-image': lead_img,
                'body': {'paragraphs': len(body), 'headings': len(heads)},
                'related': 'insights-rail' if any('Insights' in (h.get('text') or '') for h in heads) else None}
    if ptype == 'listing':
        return {**common, 'index-headline': h1, 'card-grid': {'imgCount': len(imgs)}}
    if ptype == 'program':
        return {**common, 'summary': body[0] if body else None,
                'feature-grid': sum(1 for h in heads if h.get('tag') in ('h3', 'h4')),
                'cta-band': any("What's next" in (h.get('text') or '') for h in heads)}
    if ptype == 'form':
        return {**common, 'form': True}
    if ptype in ('landing', 'unique', 'static'):
        return {**common, 'hero-headline': h1,
                'hero-subcopy': body[0] if body else None,
                'sections': [h.get('text') for h in heads if h.get('tag') == 'h2'][:12],
                'cta-band': any("What's next" in (h.get('text') or '') for h in heads)}
    return common

def main():
    files = sorted(glob.glob(f'{PAGES_DIR}/*.json'))
    pages, provenance_ok, provenance_bad = {}, [], []
    for f in files:
        slug = os.path.basename(f)[:-5]
        try:
            rec = json.load(open(f))
        except Exception as e:
            provenance_bad.append((slug, f'unreadable: {e}')); continue
        pages[slug] = rec
        pv = rec.get('_provenance') or {}
        ok = (pv.get('renderedBy') == 'playwright' and pv.get('fetchedAt') and
              isinstance(pv.get('waitMs'), (int, float)) and pv.get('waitMs') > 0 and
              pv.get('waitMode') and 200 <= (pv.get('httpStatus') or 0) < 400)
        (provenance_ok if ok else provenance_bad).append(slug if ok else (slug, 'missing live-render evidence'))

    # typing + slots
    types = {}
    for slug, rec in pages.items():
        path = urlsplit(rec.get('finalUrl') or rec.get('url') or '').path
        t = type_of(path, rec)
        types[slug] = t
        rec['slots'] = slots_for(t, rec)
        rec['type'] = t
        json.dump(rec, open(f'{PAGES_DIR}/{slug}.json', 'w'), indent=1)

    # module candidates: heading + CTA cross-page repeats
    hcount, hpages = Counter(), defaultdict(set)
    ccount, cpages = Counter(), defaultdict(set)
    for slug, rec in pages.items():
        seen = set()
        for h in rec.get('headings') or []:
            t = (h.get('text') or '').strip()
            if 4 < len(t) < 90 and t not in seen:
                seen.add(t); hcount[t] += 1; hpages[t].add(slug)
        cseen = set()
        for c in rec.get('ctas') or []:
            l = (c.get('label') or '').strip()
            if 2 < len(l) < 60 and l not in cseen:
                cseen.add(l); ccount[l] += 1; cpages[l].add(slug)
    n = len(pages)
    thresh = max(3, int(n * 0.05))
    mods = []
    def add(mid, name, kind, ev, insts, slots):
        mods.append({'id': mid, 'name': name, 'kind': kind, 'evidence': ev,
                     'instanceCount': len(insts), 'instances': sorted(insts)[:12],
                     'slots': slots, 'status': 'candidate'})
    heading_hits = {t: p for t, p in hpages.items() if len(p) >= thresh}
    json.dump({'headingRepeats': {t: len(p) for t, p in sorted(heading_hits.items(), key=lambda kv: -len(kv[1]))},
               'ctaRepeats': {l: len(p) for l, p in sorted(cpages.items(), key=lambda kv: -len(kv[1])) if len(p) >= thresh}},
              open('stardust/current/_module-signals.json', 'w'), indent=1)

    summary = {
        'inventory': n,
        'provenanceLive': len(provenance_ok),
        'provenanceBad': provenance_bad[:50],
        'types': dict(Counter(types.values())),
        'headingRepeatCandidates': len(heading_hits),
        'threshold': thresh,
    }
    json.dump(summary, open('stardust/current/_prep-summary.json', 'w'), indent=1)
    print(json.dumps(summary, indent=1)[:3000])

if __name__ == '__main__':
    main()

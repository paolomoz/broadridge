#!/usr/bin/env python3
"""Inject dynamic listing/search blocks into listing surfaces (Phase 4.5 wiring)."""
from bs4 import BeautifulSoup, NavigableString
import os, re

DA = 'stardust/migrated/da'

def load(p):
    f = f'{DA}/{p}.html'
    return (f, BeautifulSoup(open(f), 'html.parser')) if os.path.exists(f) else (f, None)

def block(doc, name, rows=None):
    b = doc.new_tag('div', attrs={'class': name})
    r = doc.new_tag('div'); c = doc.new_tag('div')
    c.append(NavigableString('auto'))
    r.append(c); b.append(r)
    return b

def ensure_block(path, name, after_heading=None, replace_text=None):
    f, doc = load(path)
    if doc is None:
        print('MISS', path); return
    main = doc.find('main')
    if main.find('div', class_=name.split()[0]):
        print('ok (exists)', path); return
    b = block(doc, name)
    placed = False
    if replace_text:
        for p in main.find_all('p'):
            if replace_text.lower() in p.get_text().lower():
                d = doc.new_tag('div'); d.append(b)
                p.replace_with(b)
                placed = True
                break
    if not placed and after_heading:
        for h in main.find_all(['h1', 'h2', 'h3']):
            if after_heading.lower() in h.get_text().lower():
                h.insert_after(b)
                placed = True
                break
    if not placed:
        # own section before metadata section
        secs = main.find_all('div', recursive=False)
        d = doc.new_tag('div'); d.append(b)
        if secs and secs[-1].find('div', class_='metadata'):
            secs[-1].insert_before(d)
        else:
            main.append(d)
    open(f, 'w').write(str(doc))
    print('injected', name, '->', path)

# press archives
ensure_block('press-hub', 'listing press', replace_text="couldn't find any results")
ensure_block('news-room', 'listing press', after_heading='Press Releases')
for loc in ['de', 'jp']:
    if os.path.exists(f'{DA}/{loc}/news-room.html'):
        ensure_block(f'{loc}/news-room', 'listing press', after_heading=None)

# insights hubs
if os.path.exists(f'{DA}/broadridge-insights.html'):
    ensure_block('broadridge-insights', 'listing insights')
hub_dir = f'{DA}/insight-pages'
if os.path.isdir(hub_dir):
    for fn in os.listdir(hub_dir):
        if fn.endswith('.html'):
            ensure_block(f'insight-pages/{fn[:-5]}', 'listing insights')

# search pages (excluded from crawl as junk; created fresh)
for path, title in [('search-results', 'Search results'), ('product-search', 'Product search')]:
    f = f'{DA}/{path}.html'
    if not os.path.exists(f):
        doc = BeautifulSoup('<body><header></header><main></main><footer></footer></body>', 'html.parser')
        main = doc.find('main')
        d = doc.new_tag('div')
        h = doc.new_tag('h1'); h.string = title; d.append(h)
        d.append(block(doc, 'search'))
        main.append(d)
        d2 = doc.new_tag('div')
        mb = doc.new_tag('div', attrs={'class': 'metadata'})
        r = doc.new_tag('div')
        c1 = doc.new_tag('div'); c1.append(NavigableString('title'))
        c2 = doc.new_tag('div'); c2.append(NavigableString(f'Broadridge - {title}'))
        r.append(c1); r.append(c2); mb.append(r)
        r2 = doc.new_tag('div')
        c3 = doc.new_tag('div'); c3.append(NavigableString('template'))
        c4 = doc.new_tag('div'); c4.append(NavigableString('listing'))
        r2.append(c3); r2.append(c4); mb.append(r2)
        d2.append(mb)
        main.append(d2)
        open(f, 'w').write(str(doc))
        print('created', path, 'with search block')

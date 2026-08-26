#!/usr/bin/env python3
"""Fetch raw server-rendered HTML for every inventory page -> stardust/current/html/<slug>.html"""
import json, os, re, subprocess, concurrent.futures as cf
from urllib.parse import urlsplit

os.makedirs('stardust/current/html', exist_ok=True)
inv = json.load(open('stardust/inventory-resolved.json'))
missing = set(json.load(open('stardust/inventory-missing.json')))
inv = [u for u in inv if u not in missing]

def slugify(u):
    p = urlsplit(u).path
    s = re.sub(r'^/|/$', '', p)
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).lower()
    return s or 'index'

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

def fetch(u):
    slug = slugify(u)
    out = f'stardust/current/html/{slug}.html'
    if os.path.exists(out) and os.path.getsize(out) > 5000:
        return (slug, 'cached')
    try:
        r = subprocess.run(['curl', '-s', '-L', '--compressed', '--max-time', '40', '-A', UA, '-o', out, '-w', '%{http_code} %{size_download}', u],
                           capture_output=True, text=True, timeout=50)
        code, size = r.stdout.split()
        if code != '200' or int(size) < 3000:
            return (slug, f'BAD {code} {size}')
        return (slug, 'ok')
    except Exception as e:
        return (slug, f'ERR {e}')

bad = []
done = 0
with cf.ThreadPoolExecutor(16) as ex:
    for slug, st in ex.map(fetch, inv):
        done += 1
        if st.startswith(('BAD', 'ERR')):
            bad.append((slug, st))
        if done % 200 == 0:
            print(f'{done}/{len(inv)} fetched, {len(bad)} bad')
print(f'done: {done}, bad: {len(bad)}')
for b in bad[:40]: print(' ', *b)
json.dump(bad, open('stardust/current/html/_fetch-failures.json', 'w'), indent=1)

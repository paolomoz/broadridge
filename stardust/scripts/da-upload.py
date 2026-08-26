#!/usr/bin/env python3
"""Upload stardust/migrated/da/** to DA (admin.da.live source API)."""
import os, glob, subprocess, concurrent.futures as cf, json, sys

ORG_SITE = 'paolomoz/broadridge'
ROOT = 'stardust/migrated/da'
TOKEN = os.environ['DA_TOKEN']

files = sorted(glob.glob(f'{ROOT}/**/*.*', recursive=True))

def upload(f):
    rel = os.path.relpath(f, ROOT)
    url = f'https://admin.da.live/source/{ORG_SITE}/{rel}'
    ctype = 'application/json' if f.endswith('.json') else 'text/html'
    for attempt in range(3):
        r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                            '-X', 'POST', '-H', f'Authorization: Bearer {TOKEN}',
                            '-F', f'data=@{f};type={ctype}', url],
                           capture_output=True, text=True, timeout=60)
        code = r.stdout.strip()
        if code in ('200', '201'):
            return rel, code
        if code == '401':
            return rel, '401-EXPIRED'
    return rel, code

ok, bad = 0, []
with cf.ThreadPoolExecutor(8) as ex:
    for rel, code in ex.map(upload, files):
        if code in ('200', '201'):
            ok += 1
        else:
            bad.append((rel, code))
            if code == '401-EXPIRED':
                print('DA token expired — aborting'); sys.exit(2)
        if ok % 200 == 0 and ok:
            print(f'{ok}/{len(files)} uploaded', flush=True)
print(f'done: {ok} ok, {len(bad)} failed of {len(files)}')
for b in bad[:30]: print(' ', *b)
json.dump(bad, open('stardust/replica/da-upload-failures.json', 'w'), indent=1)

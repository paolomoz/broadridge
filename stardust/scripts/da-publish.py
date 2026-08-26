#!/usr/bin/env python3
"""Bulk preview + publish all migrated paths via the admin.hlx.page bulk job API."""
import os, glob, json, subprocess, time, sys

ORG, SITE = 'paolomoz', 'broadridge'
ROOT = 'stardust/migrated/da'
TOKEN = os.environ['DA_TOKEN']

paths = []
for f in sorted(glob.glob(f'{ROOT}/**/*.*', recursive=True)):
    rel = '/' + os.path.relpath(f, ROOT)
    rel = rel[:-5] if rel.endswith('.html') else rel
    if rel.endswith('/index'): rel = rel[:-5]
    paths.append(rel)

def bulk(op):
    body = json.dumps({'paths': paths, 'forceUpdate': True})
    r = subprocess.run(['curl', '-s', '-X', 'POST',
                        '-H', f'Authorization: Bearer {TOKEN}',
                        '-H', 'content-type: application/json',
                        '-d', body,
                        f'https://admin.hlx.page/{op}/{ORG}/{SITE}/main/*'],
                       capture_output=True, text=True, timeout=120)
    try:
        resp = json.loads(r.stdout)
    except Exception:
        print(f'{op} unexpected response:', r.stdout[:300]); sys.exit(1)
    job = resp.get('link') or (resp.get('job') or {}).get('name')
    print(f'{op} job started: {job or resp}')
    # poll job status
    link = resp.get('links', {}).get('self') or resp.get('link')
    if link:
        for _ in range(240):
            jr = subprocess.run(['curl', '-s', '-H', f'Authorization: Bearer {TOKEN}', link],
                                capture_output=True, text=True)
            try:
                js = json.loads(jr.stdout)
            except Exception:
                break
            state = js.get('state')
            if state == 'stopped':
                progress = js.get('progress', {})
                print(f"{op} done: {progress.get('success', '?')} ok / {progress.get('failed', '?')} failed of {progress.get('total', '?')}")
                return
            time.sleep(5)
    print(f'{op}: job polling ended (check admin.hlx.page)')

print(f'{len(paths)} paths')
bulk('preview')
bulk('live')

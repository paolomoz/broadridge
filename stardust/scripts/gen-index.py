#!/usr/bin/env python3
import json, glob, os
from bs4 import BeautifulSoup
data=[]
for f in glob.glob('stardust/migrated/da/**/*.html', recursive=True):
    rel='/'+os.path.relpath(f,'stardust/migrated/da')[:-5]
    if rel.endswith('/index'): rel=rel[:-6] or '/'
    if '/fragments/' in rel or rel.endswith(('/nav','/footer')) or rel in ('/nav','/footer'): continue
    s=BeautifulSoup(open(f),'html.parser')
    mb=s.find('div',class_='metadata')
    meta={}
    if mb:
        for row in mb.find_all('div',recursive=False):
            cells=row.find_all('div',recursive=False)
            if len(cells)==2:
                k=cells[0].get_text(strip=True).lower()
                img=cells[1].find('img')
                meta[k]=img['src'] if img else cells[1].get_text(strip=True)
    data.append({'path':rel,'title':meta.get('title',''),'description':meta.get('description',''),
                 'image':meta.get('image',''),'template':meta.get('template',''),'locale':meta.get('locale',''),
                 'publishdate':meta.get('publishdate',''),'category':meta.get('category',''),'lastModified':'1756000000'})
data.sort(key=lambda r:r['path'])
json.dump({'total':len(data),'offset':0,'limit':len(data),'data':data,':type':'sheet'},open('stardust/migrated/da/query-index.json','w'))
print('query-index:',len(data))

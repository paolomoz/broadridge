#!/usr/bin/env python3
from bs4 import BeautifulSoup
import re, os
ORIGIN='https://www.broadridge.com'
def shell(): return BeautifulSoup('<body><header></header><main></main><footer></footer></body>','html.parser')
jobs=[('en','stardust/current/html/press-release-2022-annual-broadridge-distribution-achievement-awards.html',re.compile('section-company-info|company-info-block')),
      ('de','stardust/current/html/de-press-release-2026-broadridge-expands-nyfix-platform.html',re.compile('article-about-broadridge')),
      ('jp','stardust/current/html/jp-announcements-broadridge-appoints-kunimi-yatani-premier-account-leader-for-japan.html',re.compile('article-about-broadridge'))]
for loc,srcf,pat in jobs:
    soup=BeautifulSoup(open(srcf,errors='ignore').read(),'html.parser')
    secs=soup.find_all('section',class_=pat)
    doc=shell(); main=doc.find('main'); d=doc.new_tag('div'); seen=set()
    for sec in secs:
        for el in sec.find_all(['h2','h3','h4','p','ul'],recursive=True):
            if el.find_parent(['ul']) and el.name!='ul': continue
            t=el.get_text(' ',strip=True)
            if not t or t in seen: continue
            seen.add(t)
            inner=BeautifulSoup(str(el),'html.parser').find(el.name)
            for x in inner.find_all(True):
                for a in ('class','id','style','data-tracker-identifier','data-tracker-variable','tracker-event'):
                    if x.has_attr(a): del x[a]
                if x.name=='a' and x.get('href','').startswith(ORIGIN): x['href']=x['href'][len(ORIGIN):]
            if el.name in ('h2','h4'): inner.name='h3'
            d.append(inner)
    main.append(d)
    prefix='' if loc=='en' else loc+'/'
    out=f'stardust/migrated/da/{prefix}fragments/about-broadridge.html'
    os.makedirs(os.path.dirname(out),exist_ok=True)
    open(out,'w').write(str(doc))
cjobs=[('en','stardust/current/html/index.html'),('de','stardust/current/html/de.html'),('jp','stardust/current/html/jp.html')]
for loc,srcf in cjobs:
    soup=BeautifulSoup(open(srcf,errors='ignore').read(),'html.parser')
    sec=next((x for x in soup.find_all('section',class_=re.compile(r'\bcontact-us\b'))
              if x.find_parent(class_=re.compile('modal')) is None), None)
    doc=shell(); main=doc.find('main'); d=doc.new_tag('div')
    if sec:
        h=sec.find(['h2','h3'])
        if h:
            hh=doc.new_tag('h2'); hh.string=re.sub(r'\s*Header form\s*','',h.get_text(' ',strip=True)); d.append(hh)
        p0=next((x for x in sec.find_all(['p','span']) if len(x.get_text(strip=True))>60 and not x.find('a',href=re.compile('^tel:')) and not x.find(['p','span'])),None)
        if p0:
            pp=doc.new_tag('p'); pp.string=p0.get_text(' ',strip=True); d.append(pp)
        spec=next((x for x in sec.find_all(['p','h3','h4','div']) if 'specialist' in x.get_text().lower() and len(x.get_text(strip=True))<60),None)
        if spec is not None:
            sp=doc.new_tag('p'); st=doc.new_tag('strong'); st.string=spec.get_text(' ',strip=True); sp.append(st); d.append(sp)
        for a in sec.find_all('a',href=re.compile('^tel:')):
            lbl=a.get_text(' ',strip=True)
            row=a.find_parent(['li','div','p'])
            region=row.get_text(' ',strip=True).replace(lbl,'').strip() if row else ''
            pp=doc.new_tag('p')
            if region: pp.append(doc.new_string(region+' '))
            aa=doc.new_tag('a',href=a['href']); aa.string=lbl; pp.append(aa)
            d.append(pp)
    fb=doc.new_tag('div',attrs={'class':'form'})
    r=doc.new_tag('div'); c=doc.new_tag('div'); c.append(doc.new_string('contact')); r.append(c); fb.append(r)
    d.append(fb)
    main.append(d)
    prefix='' if loc=='en' else loc+'/'
    out=f'stardust/migrated/da/{prefix}fragments/contact-us.html'
    os.makedirs(os.path.dirname(out),exist_ok=True)
    open(out,'w').write(str(doc))
print('fragments generated')

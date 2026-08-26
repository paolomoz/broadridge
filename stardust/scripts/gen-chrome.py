#!/usr/bin/env python3
"""Generate nav.html + footer.html DA docs per locale from live chrome."""
import re, os
from bs4 import BeautifulSoup, NavigableString

ORIGIN = 'https://www.broadridge.com'
OUT = 'stardust/migrated/da'
LOCALES = {'en': 'index', 'de': 'de', 'jp': 'jp', 'cit': 'cit'}

def rel(href):
    if href.startswith(ORIGIN): href = href[len(ORIGIN):] or '/'
    return href

def build_nav(soup_src, out):
    """nav doc: brand / sections (nested ul) / tools"""
    hd = soup_src.find('header')
    doc = BeautifulSoup('<body><header></header><main></main><footer></footer></body>', 'html.parser')
    main = doc.find('main')

    # section 1: brand
    d1 = doc.new_tag('div')
    p = doc.new_tag('p')
    a = doc.new_tag('a', href='/')
    img = hd.find('img') if hd else None
    if img and img.get('src'):
        s = img['src']
        a.append(doc.new_tag('img', src=ORIGIN + s if s.startswith('/') else s, alt=img.get('alt', 'Broadridge')))
    else:
        a.string = 'Broadridge'
    p.append(a); d1.append(p); main.append(d1)

    # section 2: primary nav
    d2 = doc.new_tag('div')
    ul = doc.new_tag('ul')
    plist = hd.find(class_='primary-nav-list') if hd else None
    for li_src in plist.find_all('li', recursive=False) if plist else []:
        trig = li_src.find(class_='primary-nav-link')
        label = trig.get_text(' ', strip=True) if trig else None
        if not label: continue
        li = doc.new_tag('li')
        li.append(NavigableString(label))
        dd = li_src.find(class_=lambda c: c and 'dropdown' in c)
        sub = doc.new_tag('ul')
        if dd:
            # secondary groups (nested lis with their own triggers)
            sec_items = [x for x in dd.find_all('li') if x.find(class_='secondary-nav-link') and x.find(class_='tertiary-nav-link')]
            handled = set()
            if sec_items:
                for si in sec_items:
                    st = si.find(class_='secondary-nav-link')
                    sl = st.get_text(' ', strip=True)
                    if not sl or sl in handled: continue
                    handled.add(sl)
                    li2 = doc.new_tag('li')
                    if st.name == 'a' and st.get('href'):
                        aa = doc.new_tag('a', href=rel(st['href'])); aa.string = sl; li2.append(aa)
                    else:
                        li2.append(NavigableString(sl))
                    sub2 = doc.new_tag('ul')
                    for ta in si.find_all('a', class_='tertiary-nav-link', href=True):
                        tt = ta.get_text(' ', strip=True)
                        if not tt: continue
                        li3 = doc.new_tag('li')
                        aa3 = doc.new_tag('a', href=rel(ta['href'])); aa3.string = tt
                        li3.append(aa3); sub2.append(li3)
                    if sub2.contents: li2.append(sub2)
                    sub.append(li2)
                # plain secondary links (no children) in same dropdown
                for sa in dd.find_all('a', class_='secondary-nav-link', href=True):
                    tt = sa.get_text(' ', strip=True)
                    if not tt or tt in handled: continue
                    handled.add(tt)
                    li2 = doc.new_tag('li')
                    aa = doc.new_tag('a', href=rel(sa['href'])); aa.string = tt
                    li2.append(aa); sub.append(li2)
            else:
                seen = set()
                for a2 in dd.find_all('a', href=True):
                    t2 = a2.get_text(' ', strip=True)
                    if not t2 or (t2, a2['href']) in seen: continue
                    seen.add((t2, a2['href']))
                    li2 = doc.new_tag('li')
                    aa = doc.new_tag('a', href=rel(a2['href'])); aa.string = t2
                    li2.append(aa); sub.append(li2)
        if sub.contents: li.append(sub)
        ul.append(li)
    d2.append(ul); main.append(d2)

    # section 3: tools
    d3 = doc.new_tag('div')
    ulr = doc.new_tag('ul')
    for a3 in hd.find_all('a', class_=re.compile('utility-nav-link')) if hd else []:
        t3 = a3.get_text(' ', strip=True)
        if not t3: continue
        li3 = doc.new_tag('li')
        aa = doc.new_tag('a', href=rel(a3['href'])); aa.string = t3
        li3.append(aa); ulr.append(li3)
    li_s = doc.new_tag('li'); a_s = doc.new_tag('a', href='/search-results'); a_s.string = 'Search'; li_s.append(a_s); ulr.append(li_s)
    li_c = doc.new_tag('li'); st = doc.new_tag('strong'); a_c = doc.new_tag('a', href='/contact-us'); a_c.string = 'Contact us'; st.append(a_c); li_c.append(st); ulr.append(li_c)
    d3.append(ulr); main.append(d3)
    open(out, 'w').write(str(doc))

def build_footer(soup_src, out):
    ft = soup_src.find('footer')
    doc = BeautifulSoup('<body><header></header><main></main><footer></footer></body>', 'html.parser')
    main = doc.find('main')
    d = doc.new_tag('div')
    if ft is None:
        main.append(d); open(out, 'w').write(str(doc)); return
    # brand + blurb + ticker
    img = ft.find('img')
    if img and img.get('src'):
        s = img['src']
        p = doc.new_tag('p')
        p.append(doc.new_tag('img', src=ORIGIN + s if s.startswith('/') else s, alt=img.get('alt', 'Broadridge')))
        d.append(p)
    desc = ft.find(class_='footer__description')
    if desc:
        t = desc.get_text(' ', strip=True)
        tick = ft.find(class_='footer__stock-ticker')
        ticktext = tick.get_text(' ', strip=True) if tick else ''
        if ticktext and ticktext in t: t = t.replace(ticktext, '').strip()
        p = doc.new_tag('p'); p.string = t; d.append(p)
        if ticktext:
            p2 = doc.new_tag('p'); st = doc.new_tag('strong'); st.string = 'BR (NYSE)'; p2.append(st); d.append(p2)
    # social links
    soc = ft.find(class_='footer__social-media')
    if soc:
        ul = doc.new_tag('ul')
        ul['class'] = 'footer-social'
        for a in soc.find_all('a', href=True):
            li = doc.new_tag('li'); aa = doc.new_tag('a', href=a['href'])
            host = a['href'].split('/')[2] if '://' in a['href'] else a['href']
            name = 'LinkedIn' if 'linkedin' in host else 'Instagram' if 'instagram' in host else 'YouTube' if 'youtube' in host else host
            icon = a.find('img')
            if icon and icon.get('src'):
                src = icon['src']
                im = doc.new_tag('img', src=ORIGIN + src if src.startswith('/') else src, alt=name)
                aa.append(im)
            else:
                aa.string = name
            aa['aria-label'] = name
            li.append(aa); ul.append(li)
        if ul.contents: d.append(ul)
    main.append(d)

    # link columns from footer__navigation-grid
    cols = doc.new_tag('div')
    colblock = doc.new_tag('div', attrs={'class': 'footer-links'})
    row = doc.new_tag('div')
    grid = ft.find(class_='footer__navigation-grid')
    for ul_src in grid.find_all('ul', recursive=False) if grid else []:
        cell = doc.new_tag('div')
        title_li = ul_src.find('li', class_=re.compile('grid-title'))
        if title_li and 'invisible' not in ' '.join(title_li.get('class', [])):
            hh = doc.new_tag('p'); s = doc.new_tag('strong'); s.string = title_li.get_text(' ', strip=True); hh.append(s); cell.append(hh)
        ul = doc.new_tag('ul')
        for li_src in ul_src.find_all('li', class_=re.compile('grid-item')):
            a = li_src.find('a', href=True)
            if not a: continue
            t = a.get_text(' ', strip=True)
            if not t: continue
            li = doc.new_tag('li'); aa = doc.new_tag('a', href=rel(a['href'])); aa.string = t; li.append(aa); ul.append(li)
        if ul.contents: cell.append(ul)
        if cell.contents: row.append(cell)
    colblock.append(row)
    cols.append(colblock)
    main.append(cols)

    # legal row + locale websites + copyright
    dl = doc.new_tag('div')
    ul2 = doc.new_tag('ul')
    legal = ft.find(class_='footer__legal-links')
    for a in legal.find_all('a', href=True) if legal else []:
        t = a.get_text(' ', strip=True)
        if not t: continue
        li = doc.new_tag('li'); aa = doc.new_tag('a', href=rel(a['href'])); aa.string = t; li.append(aa); ul2.append(li)
    if ul2.contents: dl.append(ul2)
    sites = ft.find(class_='footer__website-list')
    if sites:
        p3 = doc.new_tag('p')
        first = True
        for a in sites.find_all('a', href=True):
            if not first: p3.append(doc.new_string(' · '))
            first = False
            aa = doc.new_tag('a', href=rel(a['href'])); aa.string = a.get_text(' ', strip=True); p3.append(aa)
        dl.append(p3)
    cp = doc.new_tag('p'); cp.string = '© 2026 Broadridge Financial Solutions, Inc. All Rights Reserved.'
    dl.append(cp)
    main.append(dl)
    open(out, 'w').write(str(doc))

for loc, slug in LOCALES.items():
    src = f'stardust/current/html/{slug}.html'
    if not os.path.exists(src):
        print('missing', src); continue
    soup = BeautifulSoup(open(src, errors='ignore').read(), 'html.parser')
    prefix = '' if loc == 'en' else f'{loc}/'
    os.makedirs(f'{OUT}/{prefix}'.rstrip('/') or OUT, exist_ok=True)
    build_nav(soup, f'{OUT}/{prefix}nav.html')
    build_footer(soup, f'{OUT}/{prefix}footer.html')
    print(f'{loc}: nav + footer written')

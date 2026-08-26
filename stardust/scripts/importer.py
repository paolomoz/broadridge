#!/usr/bin/env python3
"""
Broadridge -> EDS/DA importer.
Transforms raw source HTML (stardust/current/html/<slug>.html) into DA source
documents (stardust/migrated/da/<path>.html) with EDS block markup.

DA source format: <body><header></header><main><div>...</div>...</main><footer></footer></body>
Each top-level <div> in main = an EDS section. Blocks are <div class="name variant"><div><div>cell</div>..</div></div>.
"""
import json, os, re, sys, glob
from urllib.parse import urlsplit, urljoin
from bs4 import BeautifulSoup, NavigableString, Tag

SRC = 'stardust/current/html'
OUT = 'stardust/migrated/da'
ORIGIN = 'https://www.broadridge.com'

# ---------------------------------------------------------------- helpers

def absolutize(el):
    for a in el.find_all('a', href=True):
        h = a['href']
        if h.startswith('/') and not h.startswith('//'):
            a['href'] = h  # keep site-relative (same paths on EDS)
        elif h.startswith(ORIGIN):
            a['href'] = h[len(ORIGIN):] or '/'
    for img in el.find_all('img'):
        s = img.get('src') or img.get('data-src') or ''
        if s.startswith('/') and not s.startswith('//'):
            img['src'] = ORIGIN + s
        elif s:
            img['src'] = s
        for attr in ('srcset', 'data-srcset', 'data-src', 'loading', 'decoding', 'sizes', 'class', 'style', 'width', 'height'):
            if img.has_attr(attr) and attr not in ('src', 'alt'):
                del img[attr]
    return el

def clean_text_el(soup, el):
    """Reduce an element to clean semantic content (p, h*, ul, ol, a, strong, em, img)."""
    if el is None:
        return []
    absolutize(el)
    keep = []
    for child in el.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'img', 'blockquote', 'table'], recursive=True):
        if child.find_parent(['ul', 'ol', 'table']) and child.name not in ('ul', 'ol', 'table'):
            continue
        if child.name == 'img':
            if child.find_parent(['p', 'blockquote']):
                continue
        # skip nested duplicates
        if any(child in k.descendants for k in keep if isinstance(k, Tag)):
            continue
        keep.append(child)
    out = []
    for k in keep:
        for attr in ('class', 'id', 'style', 'data-component', 'data-tracker-identifier', 'data-tracker-variable', 'tracker-event', 'aria-label'):
            if isinstance(k, Tag) and k.has_attr(attr):
                del k[attr]
            for d in k.find_all(True) if isinstance(k, Tag) else []:
                for a2 in ('class', 'id', 'style', 'data-component', 'data-tracker-identifier', 'data-tracker-variable', 'tracker-event'):
                    if d.has_attr(a2):
                        del d[a2]
        txt = k.get_text(strip=True) if isinstance(k, Tag) else str(k).strip()
        if not txt and k.name != 'img' and not (isinstance(k, Tag) and k.find('img')):
            continue
        out.append(k)
    return out

def block(soup, name, rows):
    """rows: list of list of (Tag|str|list)"""
    cls = name.replace('(', '').replace(')', '')
    b = soup.new_tag('div', attrs={'class': cls})
    for row in rows:
        r = soup.new_tag('div')
        for cell in row:
            c = soup.new_tag('div')
            if isinstance(cell, (list, tuple)):
                for item in cell:
                    c.append(item if isinstance(item, (Tag, NavigableString)) else NavigableString(str(item)))
            elif isinstance(cell, (Tag, NavigableString)):
                c.append(cell)
            elif cell is not None:
                c.append(NavigableString(str(cell)))
            r.append(c)
        b.append(r)
    return b

def link_el(soup, href, text):
    a = soup.new_tag('a', href=href)
    a.string = text
    return a

def heading_of(sec, tags=('h1', 'h2', 'h3')):
    for t in tags:
        h = sec.find(t)
        if h:
            return h
    return None

def first_img(sec):
    img = sec.find('img')
    if img:
        s = img.get('src') or img.get('data-src') or ''
        if s.startswith('/'):
            s = ORIGIN + s
        alt = img.get('alt', '')
        return s, alt
    return None, None

def card_title(c):
    h = None
    for t in ('h2', 'h3', 'h4', 'h5'):
        h = c.find(t)
        if h: break
    if h is None:
        h = c.find(attrs={'slot': 'title'}) or c.find(class_='heading')
    return h.get_text(' ', strip=True) if h else None

LABEL_RE = re.compile(r'badge|label|chip|tag|eyebrow')

def ctas_of(sec, limit=4):
    out = []
    for a in sec.find_all('a', href=True):
        cls = ' '.join(a.get('class', []))
        if 'cta' in cls or 'button' in cls or 'btn' in cls:
            t = a.get_text(' ', strip=True)
            if t and (a['href'], t) not in out:
                out.append((a['href'], t))
        if len(out) >= limit:
            break
    return out

# ---------------------------------------------------------------- section transformers

def t_hero(soup, sec, cls):
    variant = 'hero'
    if 'hero-half' in cls: variant = 'hero (half)'
    elif 'hero-banner-text' in cls: variant = 'hero (banner)'
    elif 'hero-deconstructed' in cls: variant = 'hero (carousel)'
    elif 'themedark' in cls or 'theme-dark' in cls: variant = 'hero (dark)'
    rows = []
    # breadcrumb links
    bc = sec.find(class_=re.compile(r'breadcrumb'))
    if bc:
        links = [link_el(soup, a['href'], a.get_text(' ', strip=True)) for a in bc.find_all('a', href=True)]
        if links:
            cell = []
            for i, l in enumerate(links):
                if i: cell.append(NavigableString(' / '))
                cell.append(l)
            rows.append([cell])
        bc.extract()
    h = heading_of(sec)
    body = []
    if h:
        h2 = soup.new_tag('h1')
        h2.string = h.get_text(' ', strip=True)
        body.append(h2)
    # subcopy: first paragraphs not in cards
    for p in sec.find_all('p'):
        txt = p.get_text(' ', strip=True)
        if txt and len(txt) > 2:
            np = soup.new_tag('p'); np.string = txt
            body.append(np)
        if len(body) >= 4: break
    for href, label in ctas_of(sec, 2):
        p = soup.new_tag('p'); p.append(link_el(soup, href, label)); body.append(p)
    src, alt = first_img(sec)
    if src:
        img = soup.new_tag('img', src=src, alt=alt or '')
        body.append(img)
    rows.append([body])
    return [block(soup, variant, rows)]

def t_hero_carousel(soup, sec, cls):
    # home hero: swiper slides -> hero-carousel block, one row per slide
    rows = []
    slides = sec.select('.swiper-slide') or sec.select('.card') or [sec]
    seen = set()
    for sl in slides:
        key = sl.get_text(' ', strip=True)[:60]
        if key in seen: continue
        seen.add(key)
        cell = []
        label = sl.find(class_=LABEL_RE)
        ltxt = label.get_text(' ', strip=True) if label else None
        if ltxt:
            p = soup.new_tag('p'); em = soup.new_tag('em'); em.string = ltxt; p.append(em); cell.append(p)
        ttl = None
        h = heading_of(sl, ('h1', 'h2', 'h3'))
        if h: ttl = h.get_text(' ', strip=True)
        if not ttl: ttl = card_title(sl)
        if ttl and ltxt and ttl.startswith(ltxt): ttl = ttl[len(ltxt):].strip()
        if ttl:
            hh = soup.new_tag('h2')
            a = sl if sl.name == 'a' and sl.get('href') else sl.find('a', href=True)
            if a and a.get('href'):
                hh.append(link_el(soup, a['href'], ttl))
            else:
                hh.string = ttl
            cell.append(hh)
        for p in sl.find_all('p')[:2]:
            t = p.get_text(' ', strip=True)
            if t:
                np = soup.new_tag('p'); np.string = t; cell.append(np)
        for href, label in ctas_of(sl, 1):
            p = soup.new_tag('p'); st = soup.new_tag('strong'); st.append(link_el(soup, href, label)); p.append(st); cell.append(p)
        src, alt = first_img(sl)
        if src: cell.append(soup.new_tag('img', src=src, alt=alt or ''))
        if cell: rows.append([cell])
    if not rows:
        return t_hero(soup, sec, cls)
    return [block(soup, 'hero-carousel', rows)]

ABOUT_RE = re.compile(r'article-about-broadridge|section-company-info|company-info-block')

def t_default_content(soup, sec, cls, loc='en'):
    about_children = sec.find_all('section', class_=ABOUT_RE) if hasattr(sec, 'find_all') else []
    for ac in about_children:
        ac.extract()
    els = clean_text_el(soup, sec)
    if about_children:
        els.extend(t_about_broadridge_fragment(soup, about_children[0], '', loc))
    return els

def t_cards(soup, sec, cls, name='cards'):
    variant = name
    if 'featured-solutions' in cls: variant = 'cards (featured)'
    elif 'bento' in cls: variant = 'cards (bento)'
    elif 'analyst-recognition' in cls: variant = 'cards (awards)'
    rows = []
    cards = sec.select('.card, [class*="card__wrap"], li.grid-item') or sec.select('a[class*="card"]')
    seen = set()
    for c in cards:
        if c.find_parent(class_='card') is not None:
            continue
        key = c.get_text(' ', strip=True)[:80]
        if not key or key in seen: continue
        seen.add(key)
        imgcell, textcell = [], []
        src, alt = first_img(c)
        if src: imgcell.append(soup.new_tag('img', src=src, alt=alt or ''))
        label = c.find(class_=LABEL_RE)
        ltxt = label.get_text(' ', strip=True) if label else None
        if ltxt:
            p = soup.new_tag('p'); em = soup.new_tag('em'); em.string = ltxt; p.append(em); textcell.append(p)
        title = card_title(c)
        if title and ltxt and title.startswith(ltxt):
            title = title[len(ltxt):].strip()
        href = None
        a = c if c.name == 'a' and c.get('href') else c.find('a', href=True)
        if a: href = a.get('href')
        if title:
            hh = soup.new_tag('h3')
            if href:
                hh.append(link_el(soup, href, title))
            else:
                hh.string = title
            textcell.append(hh)
        for p in c.find_all('p'):
            t = p.get_text(' ', strip=True)
            if t and t != ltxt and t != title:
                np = soup.new_tag('p'); np.string = t; textcell.append(np)
                break
        if imgcell or textcell:
            rows.append([imgcell, textcell] if imgcell else [textcell])
    if not rows:
        return t_default_content(soup, sec, cls)
    out = []
    hh = heading_of(sec, ('h2',))
    if hh and (not cards or hh.find_parent(class_='card') is None):
        h2 = soup.new_tag('h2'); h2.string = hh.get_text(' ', strip=True); out.append(h2)
    out.append(block(soup, variant, rows))
    for href, label in ctas_of(sec, 1):
        if label.lower().startswith('explore'):
            p = soup.new_tag('p'); st = soup.new_tag('strong'); st.append(link_el(soup, href, label)); p.append(st); out.append(p)
    return out

def t_insights(soup, sec, cls):
    """Insights & perspectives rail -> insights block; curated links preserved (1:1)."""
    out = []
    hh = heading_of(sec, ('h2', 'h3'))
    if hh:
        h2 = soup.new_tag('h2'); h2.string = hh.get_text(' ', strip=True); out.append(h2)
    rows = []
    seen = set()
    for a in sec.find_all('a', href=True):
        href = a['href']
        t = a.get_text(' ', strip=True)
        if not t or href in seen or 'explore' in t.lower(): continue
        card = a if 'card' in ' '.join(a.get('class', [])) else a.find_parent(class_=re.compile('card|slide'))
        if card is None: continue
        seen.add(href)
        cell = []
        src, alt = first_img(card)
        if src: cell.append(soup.new_tag('img', src=src, alt=alt or ''))
        label = card.find(class_=LABEL_RE)
        ltxt = label.get_text(' ', strip=True) if label else None
        if ltxt:
            p = soup.new_tag('p'); em = soup.new_tag('em'); em.string = ltxt; p.append(em); cell.append(p)
        title = card_title(card) or t
        if ltxt and title.startswith(ltxt):
            title = title[len(ltxt):].strip()
        hh3 = soup.new_tag('h3'); hh3.append(link_el(soup, href, title[:150])); cell.append(hh3)
        rows.append([cell])
    if rows:
        out.append(block(soup, 'insights', rows))
    exp = [(h, l) for h, l in ctas_of(sec, 3) if 'explore' in l.lower()]
    for href, label in exp[:1]:
        p = soup.new_tag('p'); st = soup.new_tag('strong'); st.append(link_el(soup, href, label)); p.append(st); out.append(p)
    return out or t_default_content(soup, sec, cls)

def t_stats(soup, sec, cls):
    out = []
    hh = heading_of(sec, ('h2', 'h3'))
    if hh:
        h2 = soup.new_tag('h2'); h2.string = hh.get_text(' ', strip=True); out.append(h2)
    rows = []
    for st in sec.select('.swiper-slide, [class*="stat"], li'):
        val = st.find(class_=re.compile(r'value|number|numeral|heading|title'))
        txt = st.get_text(' ', strip=True)
        if not txt: continue
        m = re.match(r'^([\$€¥]?[\d,.]+[TBMK+%]*|\d+[+%]?)\s+(.*)$', txt)
        if val is not None and val.get_text(strip=True):
            v = val.get_text(strip=True)
            cap = txt.replace(v, '', 1).strip()
        elif m:
            v, cap = m.group(1), m.group(2)
        else:
            continue
        if len(v) > 20 or (v, cap[:40]) in [(r[0][0], str(r[0][1])[:40]) for r in rows if r]: continue
        strong = soup.new_tag('strong'); strong.string = v
        p = soup.new_tag('p'); p.string = cap[:200]
        rows.append([[strong, p]])
    dedup, seenv = [], set()
    for r in rows:
        k = r[0][0].get_text()
        if k in seenv: continue
        seenv.add(k); dedup.append(r)
    if dedup:
        out.append(block(soup, 'stats', dedup[:8]))
        return out
    return t_default_content(soup, sec, cls)

def t_tabs(soup, sec, cls):
    variant = 'tabs'
    if 'side-tabber' in cls or 'list-c3a' in cls: variant = 'tabs (side)'
    rows = []
    trigs = [t.get_text(' ', strip=True) for t in sec.select('.tabs__trigger-item, [role="tab"]') if t.get_text(strip=True)]
    panels = sec.select('.top-tabber__content-item, .side-tabber__content-item, .tabs__content-item, [role="tabpanel"]')
    # de-dup panels nested inside each other
    panels = [p for p in panels if not any(p is not q and p in q.descendants for q in panels)]
    if panels:
        for i, p in enumerate(panels):
            title = trigs[i] if i < len(trigs) else (card_title(p) or f'Tab {i+1}')
            cell = []
            img_src, img_alt = first_img(p)
            h = p.find(['h2', 'h3', 'h4']) or p.find(class_='heading')
            body_ps = [x.get_text(' ', strip=True) for x in p.find_all('p') if x.get_text(strip=True)]
            a = p.find('a', href=True)
            hh = soup.new_tag('h3')
            if a is not None:
                hh.append(link_el(soup, a['href'], title))
            else:
                hh.string = title
            cell.append(hh)
            seen_p = set()
            for t in body_ps[:2]:
                if t in seen_p: continue
                seen_p.add(t)
                np = soup.new_tag('p'); np.string = t; cell.append(np)
            if img_src:
                cell.append(soup.new_tag('img', src=img_src, alt=img_alt or ''))
            explore = next((x for x in p.find_all('a', href=True)
                            if x.get_text(strip=True).lower().startswith(('explore', 'learn more', 'mehr', '詳し'))), None)
            if explore is not None:
                ep = soup.new_tag('p'); ep.append(link_el(soup, explore['href'], explore.get_text(' ', strip=True))); cell.append(ep)
            rows.append([[NavigableString(title)], cell])
    else:
        for li in sec.select('li'):
            a = li.find('a', href=True)
            if not a: continue
            t = a.get_text(' ', strip=True)
            if not t: continue
            rows.append([[link_el(soup, a['href'], t)]])
    if not rows:
        return t_default_content(soup, sec, cls)
    out = []
    hh = heading_of(sec, ('h2',))
    if hh and hh.find_parent(class_=re.compile('content-item')) is None:
        h2 = soup.new_tag('h2'); h2.string = hh.get_text(' ', strip=True); out.append(h2)
        # section intro copy (first paragraph outside the tab panels)
        intro = next((x for x in sec.find_all('p')
                      if x.find_parent(class_=re.compile('content-item|tabpanel')) is None
                      and len(x.get_text(strip=True)) > 40), None)
        if intro is not None:
            ip = soup.new_tag('p'); ip.string = intro.get_text(' ', strip=True); out.append(ip)
    out.append(block(soup, variant, rows))
    return out

def t_cta_banner(soup, sec, cls):
    cell = []
    h = heading_of(sec, ('h2', 'h3', 'h4'))
    if h:
        hh = soup.new_tag('h3'); hh.string = h.get_text(' ', strip=True); cell.append(hh)
    for p in sec.find_all('p')[:2]:
        t = p.get_text(' ', strip=True)
        if t:
            np = soup.new_tag('p'); np.string = t; cell.append(np)
    ctas = []
    for a in sec.find_all('a', href=True):
        t = a.get_text(' ', strip=True)
        if t: ctas.append((a['href'], t))
    ccell = []
    for href, label in ctas[:2]:
        p = soup.new_tag('p'); p.append(link_el(soup, href, label)); ccell.append(p)
    if not cell and not ccell:
        return []
    return [block(soup, 'cta-banner', [[cell, ccell]])]

def t_video(soup, sec, cls):
    ifr = sec.find('iframe')
    url = ifr.get('src') or ifr.get('data-src') if ifr else None
    out = []
    h = heading_of(sec, ('h2', 'h3'))
    if h:
        hh = soup.new_tag('h2'); hh.string = h.get_text(' ', strip=True); out.append(hh)
    if url:
        out.append(block(soup, 'video', [[[link_el(soup, url, url)]]]))
    else:
        vid = sec.find('video')
        src = (vid.find('source') or {}).get('src') if vid else None
        if src:
            if src.startswith('/'): src = ORIGIN + src
            out.append(block(soup, 'video', [[[link_el(soup, src, src)]]]))
    return out or t_default_content(soup, sec, cls)

def t_accordion(soup, sec, cls):
    rows = []
    for item in sec.select('[class*="faq"], details, [class*="accordion-item"], [class*="accordion__item"]'):
        q = item.find(['h3', 'h4', 'summary', 'button'])
        if not q: continue
        qt = q.get_text(' ', strip=True)
        body = item.find(['div', 'p'], class_=re.compile('answer|content|body')) or item
        acell = []
        for p in body.find_all('p'):
            t = p.get_text(' ', strip=True)
            if t and t != qt:
                np = soup.new_tag('p'); np.string = t; acell.append(np)
        if qt and acell:
            rows.append([[NavigableString(qt)], acell])
    if not rows:
        # fallback: h3/h4 + following p pattern
        for h in sec.find_all(['h3', 'h4']):
            qt = h.get_text(' ', strip=True)
            sib = h.find_next_sibling('p') or (h.parent.find_next_sibling('div').find('p') if h.parent and h.parent.find_next_sibling('div') else None)
            if qt and sib:
                np = soup.new_tag('p'); np.string = sib.get_text(' ', strip=True)
                rows.append([[NavigableString(qt)], [np]])
    out = []
    hh = heading_of(sec, ('h2',))
    if hh:
        h2 = soup.new_tag('h2'); h2.string = hh.get_text(' ', strip=True); out.append(h2)
    if rows:
        out.append(block(soup, 'accordion', rows))
        return out
    return t_default_content(soup, sec, cls)

def t_share(soup, sec, cls):
    return [block(soup, 'share', [[[NavigableString('auto')]]])]

def t_media_contacts(soup, sec, cls):
    txt = sec.get_text(' ', strip=True)
    # de/jp rail boilerplate (archive + contact links only) -> handled by template rail
    if len(txt) < 120 and sec.find('a'):
        rows = []
        for a in sec.find_all('a', href=True):
            t = a.get_text(' ', strip=True)
            if t: rows.append([[link_el(soup, a['href'], t)]])
        return [block(soup, 'media-contacts', rows)] if rows else []
    cell = clean_text_el(soup, sec)
    if not cell: return []
    return [block(soup, 'media-contacts', [[cell]])]

def t_quote(soup, sec, cls):
    q = sec.find('blockquote') or sec
    cell = []
    for p in q.find_all('p')[:3]:
        t = p.get_text(' ', strip=True)
        if t:
            np = soup.new_tag('p'); np.string = t; cell.append(np)
    cite = sec.find(class_=re.compile('author|cite|name'))
    ccell = []
    if cite:
        p = soup.new_tag('p'); p.string = cite.get_text(' ', strip=True); ccell.append(p)
    if not cell:
        return t_default_content(soup, sec, cls)
    return [block(soup, 'quote', [[cell, ccell]] if ccell else [[cell]])]

def t_carousel(soup, sec, cls):
    return t_cards(soup, sec, cls, name='carousel')

def t_columns(soup, sec, cls):
    src, alt = first_img(sec)
    textcell = []
    h = heading_of(sec, ('h2', 'h3'))
    if h:
        hh = soup.new_tag('h3'); hh.string = h.get_text(' ', strip=True); textcell.append(hh)
    for p in sec.find_all('p')[:3]:
        t = p.get_text(' ', strip=True)
        if t:
            np = soup.new_tag('p'); np.string = t; textcell.append(np)
    for href, label in ctas_of(sec, 1):
        p = soup.new_tag('p'); p.append(link_el(soup, href, label)); textcell.append(p)
    imgcell = [soup.new_tag('img', src=src, alt=alt or '')] if src else []
    if not textcell and not imgcell:
        return []
    order = [imgcell, textcell] if 'left' in cls else [textcell, imgcell]
    return [block(soup, 'columns', [[c for c in order if c]])]

def t_download_form(soup, sec, cls):
    cell = []
    h = heading_of(sec, ('h2', 'h3'))
    if h:
        hh = soup.new_tag('h2'); hh.string = h.get_text(' ', strip=True); cell.append(hh)
    for p in sec.find_all('p')[:2]:
        t = p.get_text(' ', strip=True)
        if t:
            np = soup.new_tag('p'); np.string = t; cell.append(np)
    return [block(soup, 'form (download)', [[cell]])]

def t_contact_us_fragment(soup, sec, cls, locale):
    frag = {'en': '/fragments/contact-us', 'de': '/de/fragments/contact-us', 'jp': '/jp/fragments/contact-us'}.get(locale, '/fragments/contact-us')
    return [block(soup, 'fragment', [[[link_el(soup, frag, frag)]]])]

def t_about_broadridge_fragment(soup, sec, cls, locale):
    frag = {'en': '/fragments/about-broadridge', 'de': '/de/fragments/about-broadridge', 'jp': '/jp/fragments/about-broadridge'}.get(locale, '/fragments/about-broadridge')
    return [block(soup, 'fragment', [[[link_el(soup, frag, frag)]]])]

def t_drop(soup, sec, cls):
    return []

def t_layout(soup, sec, cls, loc):
    """de/jp layout--main-sidebar: main column (article body + child sections) + sidebar rails."""
    els = []
    maincol = sec.find(class_='layout__main')
    sidecol = sec.find(class_='layout__sidebar')
    if maincol is None:
        return t_default_content(soup, sec, cls)
    # child sections routed separately, in order after the body
    child_secs = maincol.find_all('section', recursive=True)
    for cs in child_secs:
        cs.extract()
    els.extend(t_default_content(soup, maincol, cls))
    for cs in child_secs:
        ccls = ' '.join(cs.get('class', []))
        if re.search(r'article-about-broadridge|section-company-info|company-info-block', ccls):
            els.extend(t_about_broadridge_fragment(soup, cs, ccls, loc))
        elif re.search(r'article-media-contacts|c6-media-contacts', ccls):
            els.extend(t_media_contacts(soup, cs, ccls))
        else:
            els.extend(t_default_content(soup, cs, ccls))
    if sidecol is not None:
        added_share = False
        for ss in sidecol.find_all('section', recursive=True):
            stxt = ss.get_text(' ', strip=True).lower()
            if ('share' in stxt or 'シェア' in stxt or 'teilen' in stxt) and not added_share:
                els.extend(t_share(soup, ss, ''))
                added_share = True
            elif ss.find('a', href=True):
                rows = []
                for a in ss.find_all('a', href=True):
                    t = a.get_text(' ', strip=True)
                    if t and 'clipboard' not in t.lower(): rows.append([[link_el(soup, a['href'], t)]])
                if rows:
                    els.append(block(soup, 'media-contacts', rows))
    return els

# transformer routing: (regex on class string, handler)
ROUTES = [
    (r'\bhero-deconstructed\b', t_hero_carousel),
    (r'\blayout\b', t_layout),
    (r'\bhero-general\b|\bhero-half\b|\bhero-banner-text\b|\bhero\b|\barticle__hero', t_hero),
    (r'\bwyswyg-section\b|\barticle-rich-text\b|\barticle-overview\b|\bcontent\b|\bdescription\b', t_default_content),
    (r'\barticle-utility-bar\b', t_share),
    (r'\barticle-about-broadridge\b|\bsection-company-info\b|\bcompany-info-block\b', t_about_broadridge_fragment),
    (r'\barticle-media-contacts\b|\bc6-media-contacts\b|\bcontact-broadridge\b', t_media_contacts),
    (r'\bcontact-us\b', t_contact_us_fragment),
    (r'\binsights\b|\brelated-articles\b|\binsights-grid\b', t_insights),
    (r'\bkey-stats\b|\bproduct-stats\b', t_stats),
    (r'\blist-c3a\b|\bside-tabber\b|\btop-tabber\b|\btabs\b', t_tabs),
    (r'\bb1-cta-banner\b|\bc2-text-slider\b', t_cta_banner),
    (r'\bvideo-module\b|\bmedia\b', t_video),
    (r'\bfaqs-section\b', t_accordion),
    (r'\btestimonial\b', t_quote),
    (r'\bproduct-carousel\b', t_carousel),
    (r'\bcareers\b|\btwo-col-text-feature\b', t_columns),
    (r'\bfeatured-solutions\b|\bbento-grid\b|\banalyst-recognition\b|\bcards\b|\bcard-grid\b|\bc1b-card-grid\b|\bsegment-solutions\b|\bproducts-solution\b|\brelated-products-solutions\b|\bsolution-products\b|\bproduct-features\b|\bproduct-specs\b', t_cards),
    (r'\bdownload-form\b', t_download_form),
    (r'\bsection-back-to-top\b|\bsidebar-section\b', t_drop),
]

LOCALE_FRAG_HANDLERS = (t_contact_us_fragment, t_about_broadridge_fragment, t_layout)

# ---------------------------------------------------------------- page pipeline

def locale_of(path):
    seg = path.strip('/').split('/')[0] if path.strip('/') else ''
    return seg if seg in ('de', 'jp', 'cit') else 'en'

def template_of(path, ptype):
    p = path.strip('/')
    if p.startswith(('press-release', 'de/press-release', 'jp/press-release', 'de/pressemitteilung')): return 'press-release'
    if p.startswith('cit'): return 'cit'
    if ptype == 'article': return 'article'
    if ptype == 'program': return 'capability'
    if p.startswith(('who-we-serve', 'de/who-we-serve', 'jp/who-we-serve')): return 'segment'
    if ptype == 'static': return 'legal' if 'legal' in p else 'static'
    if ptype == 'form': return 'form'
    if ptype == 'listing': return 'listing'
    return 'landing'

def meta_rows(soup, meta):
    rows = []
    for k, v in meta.items():
        if v is None or v == '': continue
        rows.append([[NavigableString(k)], [v] if isinstance(v, Tag) else [NavigableString(str(v))]])
    return block(soup, 'metadata', rows)

DATE_RE = re.compile(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(\d{4})')

def publish_date(main_el, path):
    txt = main_el.get_text(' ', strip=True)[:3000]
    m = DATE_RE.search(txt)
    if m:
        try:
            import datetime
            d = datetime.datetime.strptime(m.group(0), '%B %d, %Y')
            return d.strftime('%Y-%m-%d')
        except Exception:
            pass
    m2 = re.search(r'/press-release/(\d{4})/', path)
    if m2: return f'{m2.group(1)}-01-01'
    return None

def category_of(path):
    m = re.match(r'^/(?:de/|jp/)?article/([a-z-]+)/', path)
    if m: return m.group(1)
    return None

def convert(slug, rec):
    src_file = f'{SRC}/{slug}.html'
    if not os.path.exists(src_file):
        return None, 'no-html'
    html = open(src_file, errors='ignore').read()
    soup = BeautifulSoup(html, 'html.parser')
    main = soup.find('main')
    if main is None:
        main = soup.find('body')
        if main is None:
            return None, 'no-main'
    url = rec.get('finalUrl') or rec.get('url')
    path = urlsplit(url).path or '/'
    loc = locale_of(path)
    tmpl = template_of(path, rec.get('type'))

    out = BeautifulSoup('<body><header></header><main></main><footer></footer></body>', 'html.parser')
    omain = out.find('main')

    sections = [s for s in main.find_all('section', recursive=True) if s.find_parent('section') is None
                and s.find_parent(['header', 'footer']) is None
                and s.find_parent(class_=re.compile(r'modal')) is None]
    if not sections:
        sections = [main]
    # content sections that live OUTSIDE <main> (en press releases put
    # company-info between main and footer) — include them in order
    body_el = soup.find('body')
    if body_el and main.name == 'main':
        for s in body_el.find_all('section', recursive=True):
            if s.find_parent(['main', 'header', 'footer']) is not None or s.find_parent('section') is not None:
                continue
            if s.find_parent(class_=re.compile(r'modal')) is not None:
                continue
            sections.append(s)

    used = 0
    for sec in sections:
        cls = ' '.join(sec.get('class', []))
        handler = None
        for pat, h in ROUTES:
            if re.search(pat, cls):
                handler = h
                break
        if handler is None:
            handler = t_default_content
        try:
            if handler in LOCALE_FRAG_HANDLERS:
                els = handler(out, sec, cls, loc)
            else:
                els = handler(out, sec, cls)
        except Exception as e:
            els = t_default_content(out, sec, cls)
        if not els:
            continue
        sig = str(els[0])[:200] if els else ''
        if used and sig and sig == getattr(convert, '_last_sig', None) and ('fragment' in sig or 'share' in sig):
            continue
        convert._last_sig = sig
        d = out.new_tag('div')
        for el in els:
            d.append(el)
        style = None
        if 'theme-light' in cls: style = 'light'
        elif 'themedark' in cls or 'theme-dark' in cls: style = 'dark'
        elif 'contact-us' in cls: style = 'tint'
        if style and not any('hero' in (getattr(e, 'get', lambda k, d=None: d)('class') or [''])[0] for e in els if hasattr(e, 'get')):
            sm = out.new_tag('div', attrs={'class': 'section-metadata'})
            r = out.new_tag('div'); c1 = out.new_tag('div'); c1.append(NavigableString('style'))
            c2 = out.new_tag('div'); c2.append(NavigableString(style)); r.append(c1); r.append(c2); sm.append(r)
            d.append(sm)
        omain.append(d)
        used += 1

    # metadata section
    title = (soup.title.string or '').strip() if soup.title else rec.get('title', '')
    desc = ''
    md = soup.find('meta', attrs={'name': 'description'})
    if md: desc = md.get('content', '')
    ogi = soup.find('meta', attrs={'property': 'og:image'})
    ogimg = ogi.get('content') if ogi else None
    meta = {
        'title': title,
        'description': desc,
        'template': tmpl,
        'locale': {'en': 'en-US', 'de': 'de-DE', 'jp': 'ja-JP', 'cit': 'en-US'}[loc],
    }
    pd = publish_date(main, path) if tmpl in ('press-release', 'article') else None
    if pd: meta['publishdate'] = pd
    cat = category_of(path)
    if cat: meta['category'] = cat
    if ogimg:
        meta['image'] = out.new_tag('img', src=ogimg if ogimg.startswith('http') else ORIGIN + ogimg, alt='')
    d = out.new_tag('div')
    d.append(meta_rows(out, meta))
    omain.append(d)

    # output path mirrors URL path
    p = path.strip('/')
    opath = f'{OUT}/{p if p else "index"}.html'
    if p.endswith('/'): opath = f'{OUT}/{p}index.html'
    os.makedirs(os.path.dirname(opath), exist_ok=True)
    open(opath, 'w').write(str(out))
    return opath, f'ok sections={used}'

def main_run(only=None):
    st = json.load(open('stardust/state.json'))
    results = {'ok': 0, 'fail': []}
    for p in st['pages']:
        slug = p['slug']
        if only and slug not in only: continue
        opath, status = convert(slug, p)
        if status.startswith('ok'):
            results['ok'] += 1
        else:
            results['fail'].append((slug, status))
        if results['ok'] % 250 == 0 and results['ok']:
            print(f"converted {results['ok']}...", flush=True)
    print(f"done: {results['ok']} ok, {len(results['fail'])} failed")
    for f in results['fail'][:30]: print('  FAIL', *f)
    json.dump(results['fail'], open('stardust/migrated/_import-failures.json', 'w'), indent=1)

if __name__ == '__main__':
    only = set(sys.argv[1:]) or None
    main_run(only)

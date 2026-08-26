#!/usr/bin/env python3
"""Generate /test-b-* DA docs for who-we-serve (segment) pages from saved live HTML."""
import re, sys, html as H

def balanced(src, start_tag_idx, tag='section'):
    depth=0
    for m in re.finditer(r'</?'+tag+r'\b', src[start_tag_idx:]):
        depth += -1 if m.group(0).startswith('</') else 1
        if depth==0:
            e=start_tag_idx+m.end()
            return src[start_tag_idx:src.find('>',e)+1]
    return ''

def sections(src):
    out=[]
    for m in re.finditer(r'<section class="([^"]*)"[^>]*?(?:data-component="([^"]*)"|componentName="([^"]*)")', src):
        out.append((m.group(2) or m.group(3) or '', m.group(1), balanced(src, m.start())))
    return out

def txt(s): return H.unescape(re.sub(r'\s+',' ', re.sub(r'<[^>]+>','',s)).strip())
def esc(s): return s.replace('&','&amp;').replace('<','&lt;')

def abs_url(u):
    return 'https://www.broadridge.com'+u if u.startswith('/') else u

HERO_BG_RE=re.compile(r"url\(\s*['\"]?([^)'\"]+Hero[^)'\"]*)['\"]?\s*\)")

def gen(slug):
    for pref in ('who-we-serve-','',):
        try:
            src=open(f'stardust/current/html/{pref}{slug}.html').read(); break
        except FileNotFoundError: continue
    main=src[src.find('<main'):]
    secs=sections(main)
    body=[]
    title_m=re.search(r'<title>([^<]*)</title>', src)
    desc_m=re.search(r'name="description" content="([^"]*)"', src)
    for comp, cls, sec in secs:
        if 'General Hero' in comp:
            h1=txt(re.search(r'<h1[^>]*>(.*?)</h1>', sec, re.S).group(1))
            p=re.search(r'heading-desc[^>]*>\s*<p>(.*?)</p>', sec, re.S)
            bg=HERO_BG_RE.search(src)
            cta=re.search(r'href=\'([^\']+)\'[^>]*>\s*<span>\s*([^<]+?)\s*</span>', sec)
            inner=f'<h1>{esc(h1)}</h1><p>{esc(txt(p.group(1)) if p else "")}</p>'
            if cta: inner+=f'<p><strong><a href="{cta.group(1).strip()}">{esc(cta.group(2))}</a></strong></p>'
            img=''
            if bg: img=f'<p><img alt="" src="{abs_url(bg.group(1).strip())}"/></p>'
            body.append(f'<div><div class="hero dark"><div><div>{img}{inner}</div></div></div></div>')
        elif 'Text Slider' in comp:
            t=txt(re.search(r'c2-text-slider__title[^>]*>(.*?)</h2>', sec, re.S).group(1))
            items=[]
            for sm in re.finditer(r'slider-slide swiper-slide[^>]*>(.*?)(?=<div class="c2-text-slider__slider-slide|</div>\s*</div>\s*<div class="slider-controls)', sec, re.S):
                st=re.search(r'slide-title[^>]*>\s*([^<]*?)\s*<', sm.group(1))
                sd=re.search(r'body-3[^>]*>\s*([^<]+)', sm.group(1))
                items.append((txt(st.group(1)) if st else '', txt(sd.group(1)) if sd else ''))
            parts=[f'<h2>{esc(t)}</h2>']
            for it_t, it_d in items:
                if it_t: parts.append(f'<h3>{esc(it_t)}</h3>')
                if it_d: parts.append(f'<p>{esc(it_d)}</p>')
            body.append('<div>'+''.join(parts)+'<div class="section-metadata"><div><div>style</div><div>text-slider</div></div></div></div>')
        elif 'Side Tabber' in comp:
            t=re.search(r'section-header">\s*<h2[^>]*>(.*?)</h2>', sec, re.S)
            h2=txt(t.group(1)) if t else 'Our solutions'
            tabs=[]
            for tm in re.finditer(r'<a[^>]*href=\'([^\']+)\'[^>]*class="card[^"]*"(.*?)</a>', sec, re.S):
                tt=re.search(r'side-tabber__title">\s*([^<]+)', tm.group(2))
                td=re.search(r'card-description">\s*(?:<p>)?([^<]+)', tm.group(2))
                if tt: tabs.append((txt(tt.group(1)), tm.group(1).strip(), txt(td.group(1)) if td else ''))
            rows=''.join(f'<div><div>{esc(t2)}</div><div><h3><a href="{href}">{esc(t2)}</a></h3>'+(f'<p>{esc(d)}</p>' if d else '')+'</div></div>' for t2,href,d in tabs)
            body.append(f'<div><h2>{esc(h2)}</h2><div class="tabs side">{rows}</div></div>')
        elif 'Key Stats' in comp:
            t=re.search(r'key-stats__title[^>]*>\s*([^<]+)', sec)
            vals=re.findall(r'display-2[^"]*"[^>]*>\s*([^<]+?)\s*</div>\s*<div[^>]*class="text-atom[^"]*"[^>]*>\s*(?:<p>)?([^<]+)', sec)
            cells=''.join(f'<div><div><strong>{esc(v.strip())}</strong><p>{esc(d.strip())}</p></div></div>' for v,d in vals)
            body.append(f'<div><h2>{esc(txt(t.group(1)))}</h2><div class="stats">{cells}</div></div>')
        elif 'Bento' in comp:
            t=re.search(r'section-header[^>]*>.*?<h2[^>]*>(.*?)</h2>', sec, re.S)
            h2=txt(t.group(1)) if t else 'Recognized by the industry'
            cards=[]
            for cm in re.finditer(r'<a[^>]*href=\'([^\']+)\'[^>]*class="card[^"]*"(.*?)</a>', sec, re.S):
                badge=re.search(r'badge[^>]*>\s*([^<]+)', cm.group(2))
                ct=re.search(r'<h2[^>]*>\s*(.*?)\s*</h2>|<h3[^>]*>\s*(.*?)\s*</h3>|title-[12]">\s*(.*?)\s*</', cm.group(2), re.S)
                img=re.search(r'<img src="([^"]+)"', cm.group(2))
                title=txt((ct.group(1) or ct.group(2) or ct.group(3)) if ct else '')
                cards.append((badge.group(1).strip() if badge else '', title, cm.group(1).strip(), img.group(1) if img else None))
            variant='bento' if 'four-plus-one' in cls else ('bento-six' if 'six-cards' in cls else 'awards')
            lis=''
            for bg,ti,href,img in cards:
                imgp=f'<div><img alt="Broadridge Image" src="{abs_url(img)}"/></div>' if img else ''
                lis+=f'<div>{imgp}<div><p><em>{esc(bg)}</em></p><h3><a href="{href}">{esc(ti)}</a></h3></div></div>'
            cta=re.search(r'__cta">\s*<a[^>]*href=\'([^\']+)\'[^>]*>\s*<span>\s*([^<]+?)\s*</span>', sec)
            ctap=f'<p><strong><a href="{cta.group(1).strip()}">{esc(cta.group(2))}</a></strong></p>' if cta else ''
            body.append(f'<div><h2>{esc(h2)}</h2><div class="cards {variant}">{lis}</div>{ctap}</div>')
        elif 'CTA Banner' in comp:
            bgimg=re.search(r'--bg-desktop-image-url:\s*url\([\'"]?([^)\'\"]+)', sec)
            t=re.search(r'<div[^>]*class="heading[^"]*"[^>]*>\s*([^<]+)', sec)
            sub=re.search(r'body-2[^>]*>\s*(?:<p>)?([^<]+)', sec)
            btn=re.search(r'cta-wrap.*?href=\'([^\']+)\'.*?<span>\s*([^<]+?)\s*</span>', sec, re.S)
            imgp=f'<p><img alt="" src="{abs_url(bgimg.group(1).strip())}"/></p>' if bgimg else ''
            tt=txt(t.group(1)) if t else ''
            parts=f'{imgp}<h3>{esc(tt)}</h3>'
            if sub: parts+=f'<p>{esc(txt(sub.group(1)))}</p>'
            if btn: parts+=f'<p><strong><a href="{btn.group(1).strip()}">{esc(btn.group(2))}</a></strong></p>'
            body.append(f'<div>{parts}<div class="section-metadata"><div><div>style</div><div>b1-banner</div></div></div></div>')
        elif 'Media' in comp or (' media ' in ' '+cls+' '):
            v=re.search(r'data-vimeo-url="([^"]+)"', sec)
            if v:
                u=H.unescape(v.group(1))
                body.append(f'<div><div class="video"><div><div><a href="{u}">{u}</a></div></div></div><div class="section-metadata"><div><div>style</div><div>media-video</div></div></div></div>')
        elif 'Card Grid' in comp:
            h=re.search(r'<h2[^>]*>\s*([^<]+)', sec)
            lis=''
            for cm in re.finditer(r'<a[^>]*href=\'([^\']+)\'[^>]*class="card[^"]*"(.*?)</a>', sec, re.S):
                t=re.search(r'title-\d">\s*([^<]+)|<h3[^>]*>\s*([^<]+)', cm.group(2))
                if t: lis+=f'<div><div><h3><a href="{cm.group(1).strip()}">{esc(txt(t.group(1) or t.group(2)))}</a></h3></div></div>'
            body.append(f'<div><h2>{esc(txt(h.group(1)) if h else "")}</h2><div class="cards grid-navy">{lis}</div></div>')
        elif 'Alternating Content' in comp:
            img=re.search(r'<img src="([^"]+)"', sec)
            t=re.search(r'careers__title[^>]*>\s*([^<]+)', sec)
            d=re.search(r'careers__description[^>]*>(?:\s*<p>)?(.*?)(?:</p>|</div>)', sec, re.S)
            cta=re.search(r'href=\'([^\']+)\'[^>]*>\s*<span>\s*([^<]+?)\s*</span>', sec[sec.find('careers__description'):] if 'careers__description' in sec else sec)
            imgp=f'<img alt="" src="{abs_url(img.group(1))}"/>' if img else ''
            row=f'<div><div>{imgp}</div><div><h3>{esc(txt(t.group(1)) if t else "")}</h3><p>{esc(txt(d.group(1)) if d else "")}</p>'+(f'<p><strong><a href="{cta.group(1).strip()}">{esc(cta.group(2))}</a></strong></p>' if cta else '')+'</div></div>'
            body.append(f'<div><div class="columns media-card">{row}</div></div>')
        elif 'Insights' in comp:
            cards=''
            for cm in re.finditer(r'<a[^>]*href=\'([^\']+)\'[^>]*class="card insights__slider-slide[^"]*"(.*?)</a>', sec, re.S):
                img=re.search(r'<img src="([^"]+)"', cm.group(2))
                badge=re.search(r'badge[^>]*>\s*([^<]+)', cm.group(2))
                ct=re.search(r'<h2[^>]*>\s*(.*?)\s*</h2>', cm.group(2), re.S)
                cards+=f'<div><div><img alt="" src="{abs_url(img.group(1)) if img else ""}"/><p><em>{esc(badge.group(1).strip()) if badge else ""}</em></p><h3><a href="{cm.group(1).strip()}">{esc(txt(ct.group(1)) if ct else "")}</a></h3></div></div>'
            body.append(f'<div><h2>Insights &amp; perspectives</h2><div class="insights">{cards}</div><div class="section-metadata"><div><div>style</div><div>light</div></div></div></div>')
        elif 'Download Form' in comp:
            h=re.search(r'<h2[^>]*>\s*([^<]+)', sec)
            intro=re.search(r'body-2[^>]*>\s*<p>(.*?)</p>', sec, re.S)
            body.append(f'<div><h2>{esc(txt(h.group(1)) if h else "Get an inside look")}</h2><p>{esc(txt(intro.group(1)) if intro else "")}</p><div class="form"><div><div>download</div></div></div><div class="section-metadata"><div><div>style</div><div>tint</div></div></div></div>')
        elif 'Contact Us' in comp and 'main' not in cls:
            body.append('<div><div class="fragment"><div><div><a href="/fragments/contact-us-test-b">/fragments/contact-us-test-b</a></div></div></div><div class="section-metadata"><div><div>style</div><div>tint</div></div></div></div>')
    meta=f'<div><div class="metadata"><div><div>title</div><div>{esc(title_m.group(1)) if title_m else ""}</div></div><div><div>description</div><div>{esc(desc_m.group(1)) if desc_m else ""}</div></div><div><div>template</div><div>test-b</div></div><div><div>footer</div><div>/footer-test-b</div></div><div><div>locale</div><div>en-US</div></div></div></div>'
    doc='<body><header></header><main>'+''.join(body)+meta+'</main><footer></footer></body>'
    open(f'stardust/migrated/da/test-b-{slug}.html','w').write(doc)
    print(slug, len(doc), 'sections:', len(body))

for slug in sys.argv[1:]:
    gen(slug)

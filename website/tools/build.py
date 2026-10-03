"""Generate both static language versions. Run: python3 tools/build.py."""
from pathlib import Path
from html import escape
import os
from content import UI, PROJECTS, PROJECT_META
ROOT = Path(__file__).resolve().parents[1]

def relative(target, route):
    return os.path.relpath(ROOT / target, (ROOT / route).parent).replace(os.sep, '/')

def local_route(lang, name):
    return ('zh/' if lang == 'zh' else '') + name

def head(title, description, route, lang):
    prefix = relative('assets', route) + '/'
    language = 'zh-CN' if lang == 'zh' else 'en'
    alternate = route[3:] if lang == 'zh' else 'zh/' + route
    return f'''<!doctype html><html lang="{language}" data-route="{route}" data-language="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>{escape(title)}</title><meta name="description" content="{escape(description, quote=True)}"><link rel="alternate" hreflang="{'en' if lang=='zh' else 'zh-CN'}" href="{relative(alternate,route)}"><link rel="icon" type="image/svg+xml" href="{prefix}favicon.svg"><link rel="stylesheet" href="{prefix}style.css"><script src="{prefix}app.js" defer></script></head><body><a class="skip" href="#main">{UI[lang]['skip']}</a>'''

def header(route, lang):
    u=UI[lang]; home=relative(local_route(lang,'index.html'),route)
    en=route[3:] if lang=='zh' else route; zh='zh/'+en
    switch=''.join(f'<a href="{relative(target,route)}" data-set-language="{key}" lang="{key if key=="en" else "zh-CN"}" hreflang="{key if key=="en" else "zh-CN"}" aria-label="{label}"'+(' aria-current="true"' if key==lang else '')+f'>{text}</a>' for key,target,text,label in [('en',en,'EN','English'),('zh',zh,'中文','简体中文')])
    return f'''<header><div class="wrap"><a class="brand" href="{home}" aria-label="Merci">Merci<span>.</span></a><div class="header-right"><nav aria-label="{u['nav']}"><a href="{home}#work">{u['work']}</a><a href="{home}#about">{u['about']}</a><a href="{home}#contact">{u['contact']}</a></nav><div class="language-switch" role="group" aria-label="{u['language']}">{switch}</div></div></div></header>'''

def footer(lang):
    u=UI[lang]
    return f'''<footer><div class="wrap"><span>{u['footer']}</span><div class="footer-links"><a href="https://github.com/hyandnn">GitHub</a><a href="mailto:haoling.yang@rwth-aachen.de">{u['email']}</a></div></div></footer></body></html>'''

def paragraphs(texts):
    return ''.join('<p>'+p+'</p>' for p in texts)

def controls(lang, layers):
    u=UI[lang]
    layer_html=''.join(f'<label><input type="checkbox" data-layer="{key}" checked>{u[label]}</label>' for key,label in layers)
    return f'''<div class="demo-controls"><button type="button" data-play>{u['play']}</button><label class="timeline"><input type="range" min="0" max="1000" value="0" data-time aria-label="{u['time']}"><output data-time-label>0.0 s</output></label>{f'<div class="layers" aria-label="{u["layers"]}">{layer_html}</div>' if layer_html else ''}</div>'''

def demo(p, lang):
    u=UI[lang];slug=p['slug']
    if slug in ('stereo','lidar'):
        content=f'<canvas data-scene="{slug}" role="img" aria-label="{escape(p["caption"])}"></canvas>'
        layers=[('points','points'),('geometry','geometry')] if slug=='stereo' else [('points','returns'),('rays','rays'),('tracks','tracks')]
    else:
        content='<div class="phase-grid">'
        for i,(title,description) in enumerate(p['panels']):
            content+=f'<figure class="phase"><canvas data-scene="{slug}" data-panel="{i}" role="img" aria-label="{escape(description)}"></canvas><figcaption><h3>{title}</h3><p>{description}</p></figcaption></figure>'
        content+='</div>';layers=[]
    return f'''<div class="demo" data-demo="{slug}"><div class="demo-head"><span>{u['demo']} · {p['name']}</span><span>{u['synthetic']}</span></div>{content}{controls(lang,layers)}<p class="demo-caption">{p['caption']} {u['notice']}</p></div>'''

def flow(p,lang):
    title='Conceptual method' if lang=='en' else '概念流程'
    return '<ol class="method-flow" aria-label="'+title+'">'+''.join(f'<li><span class="flow-index">0{i+1}</span><h3>{label}</h3><p>{desc}</p></li>' for i,(label,desc) in enumerate(p['flow']))+'</ol>'

for lang in ['en','zh']:
    u=UI[lang]
    projects=[]
    for meta,source in zip(PROJECT_META,PROJECTS[lang]):
        p=dict(source);p.update(slug=meta[0],number=meta[1],theme=meta[2]);projects.append(p)
    route=local_route(lang,'index.html')
    cards=''
    for p in projects:
        cards+=f'''<a class="project-card {p['theme']}" href="projects/{p['slug']}.html"><div class="card-view"><canvas data-scene="{p['slug']}-cover" data-preview="true" role="img" aria-label="{escape(p['summary'])}"></canvas></div><div class="card-copy"><div class="card-heading"><span class="index">{p['number']}</span><h3>{p['name']}</h3></div><p>{p['summary']}</p><div class="card-foot"><span class="mono">{p['topic']}</span><span>{u['read']}</span></div></div></a>'''
    tools=''.join(f'<div><b>{name}</b><p>{desc}</p></div>' for name,desc in u['toolkit'])
    home=head('Merci — '+u['hero_role'],u['about_p1'],route,lang)+header(route,lang)
    home+=f'''<main id="main"><section class="hero" aria-labelledby="hero-title"><div><div class="eyebrow">{u['hero_role']}</div><h1 id="hero-title">{u['hero_title']}</h1><p class="intro">{u['hero_intro']}</p><div class="hero-actions"><a class="primary-link" href="#work">{u['explore']}</a><a class="text-link secondary-link" href="https://github.com/hyandnn">{u['github']}</a></div></div><div class="hero-visual"><div class="visual-top"><span>{u['hero_visual']}</span><span>{u['synthetic']}</span></div><canvas data-scene="hero" role="img" aria-label="{u['hero_visual']}"></canvas><div class="visual-bottom"><span>{u['hero_bottom']}</span></div></div></section><div class="info-strip">{''.join('<span>'+s+'</span>' for s in u['strip'])}</div><section id="work" aria-labelledby="work-title"><div class="section-top"><div><div class="eyebrow">{u['selected']}</div><h2 id="work-title">{u['work_title']}</h2></div><p>{u['work_intro']}</p></div><div class="work-grid">{cards}</div><p class="notice">{u['notice']}</p></section><section class="about" id="about" aria-labelledby="about-title"><div><div class="eyebrow">{u['about']} / Merci</div><h2 id="about-title">{u['about_title']}</h2></div><div class="about-text"><p>{u['about_p1']}</p><p>{u['about_p2']}</p><div class="toolkit">{tools}</div><p class="additional">{u['about_extra']}</p></div></section><section class="contact" id="contact" aria-labelledby="contact-title"><div><div class="eyebrow">{u['contact']}</div><h2 id="contact-title">{u['contact_title']}</h2><p>{u['contact_copy']}</p></div><a class="text-link" href="mailto:haoling.yang@rwth-aachen.de">haoling.yang@rwth-aachen.de</a></section></main>'''+footer(lang)
    (ROOT/route).parent.mkdir(parents=True,exist_ok=True);(ROOT/route).write_text(home)
    for i,p in enumerate(projects):
        route=local_route(lang,'projects/'+p['slug']+'.html')
        home=relative(local_route(lang,'index.html'),route)
        page=head(p['name']+' — Merci',p['summary'],route,lang)+header(route,lang)
        page+=f'''<main id="main" class="{p['theme']}"><a class="back" href="{home}#work">{u['back']}</a><section class="case-head"><div class="eyebrow">{p['number']} / {p['name']}</div><h1>{p['title']}</h1><p class="lead">{p['lead']}</p><div class="case-meta"><div><span class="label">{u['role']}</span><p>{p['role']}</p></div><div><span class="label">{u['context']}</span><p>{p['context']}</p></div></div></section>'''+demo(p,lang)
        for k,key in enumerate(['problem','method','choices','result']):
            content=paragraphs(p[key]) if key!='choices' else '<div class="decision-grid">'+''.join(f'<div class="decision"><h3>{title}</h3><p>{copy}</p></div>' for title,copy in p['choices'])+'</div>'
            if key=='method':content=flow(p,lang)+content
            page+=f'<section class="story"><div class="story-index">0{k+1} / {u[key]}</div><div class="story-body"><h2>{p[key+"_title"]}</h2>{content}</div></section>'
        prev,nxt=projects[(i-1)%4],projects[(i+1)%4]
        page+=f'''<div class="case-nav"><div><small>{u['previous']}</small><a href="{prev['slug']}.html">{prev['name']}</a></div><div><small>{u['next']}</small><a href="{nxt['slug']}.html">{nxt['name']}</a></div></div></main>'''+footer(lang)
        (ROOT/route).parent.mkdir(parents=True,exist_ok=True);(ROOT/route).write_text(page)
    route=local_route(lang,'404.html')
    (ROOT/route).write_text(head('404 — Merci',u['notfound'],route,lang)+header(route,lang)+f'<main id="main" class="empty-page"><div class="eyebrow">404</div><h1>{u["notfound"]}</h1><a class="text-link" href="index.html">{u["return"]}</a></main>'+footer(lang))
print('Built 12 static pages: 2 languages × (homepage, four cases, 404).')

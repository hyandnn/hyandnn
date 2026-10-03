"""Package the exact pages into a self-contained offline preview."""
from pathlib import Path
import base64
import json
import mimetypes
import re

root = Path(__file__).resolve().parents[1]
pages = {}
for f in [root/'index.html', root/'404.html', *sorted((root/'projects').glob('*.html')), root/'zh/index.html', root/'zh/404.html', *sorted((root/'zh/projects').glob('*.html'))]:
    page = f.read_text()
    import os
    prefix = os.path.relpath(root/'assets',f.parent).replace(os.sep,'/')+'/'
    css = (root/'assets/style.css').read_text()
    js = (root/'assets/app.js').read_text()
    page = page.replace(f'<link rel="stylesheet" href="{prefix}style.css">', '<style>'+css+'</style>')
    page = page.replace(f'<script src="{prefix}app.js" defer></script>', '<script>'+js+'</script>')
    for asset in (root/'assets').iterdir():
        if asset.suffix in ['.png','.gif','.svg']:
            data='data:'+mimetypes.guess_type(asset)[0]+';base64,'+base64.b64encode(asset.read_bytes()).decode()
            page=page.replace(prefix+asset.name,data)
    page = re.sub(r'href="(https?://[^"]+)"', r'href="\1" target="_blank" rel="noopener noreferrer"', page)
    # Local navigation requests load the corresponding exact page in the parent.
    nav = '''<script>document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;var h=a.getAttribute('href');if(!h||/^(https?:|mailto:|data:)/.test(h))return;e.preventDefault();parent.postMessage({portfolioNavigation:h},'*');});</script>'''
    page = page.replace('</body>',nav+'</body>')
    # Place the real script at the document end so canvas elements exist.
    app = '<script>'+js+'</script>'
    page = page.replace(app,'').replace('</body>',app+'</body>')
    pages[f.relative_to(root).as_posix()] = page

payload = json.dumps(pages).replace('</','<\\/')
shell = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Merci — offline portfolio preview</title><style>html,body{margin:0;height:100%;background:#090d12}iframe{border:0;width:100%;height:100%;display:block}</style><iframe id="portfolio" title="Merci portfolio preview"></iframe><script>
const pages=PAYLOAD,frame=document.getElementById('portfolio');let current='index.html',pendingAnchor='';
function load(route,anchor){current=route;pendingAnchor=anchor||'';frame.srcdoc=pages[route];}
frame.addEventListener('load',()=>{if(pendingAnchor)frame.contentDocument.getElementById(pendingAnchor)?.scrollIntoView();});
window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||typeof e.data?.portfolioNavigation!=='string')return;const raw=e.data.portfolioNavigation;const [path,anchor]=raw.split('#');if(!path){frame.contentDocument.getElementById(anchor)?.scrollIntoView();return;}const url=new URL(path,'https://preview.invalid/'+current);const route=url.pathname.slice(1);if(pages[route]){load(route,anchor);history.replaceState(null,'','#'+route+(anchor?'~'+anchor:''));}});
const [initial,anchor]=(location.hash.slice(1)||'index.html').split('~');load(pages[initial]?initial:'index.html',anchor);
</script></html>'''.replace('PAYLOAD',payload)
(root/'handoff'/'preview.html').write_text(shell)
print('Self-contained preview:',len(shell.encode()),'bytes')

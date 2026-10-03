"""Independent synthetic illustrations. No product data or production algorithms.
Run with Python 3 and Pillow. Font search supports Linux and Windows.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
W, H = 1080, 380
BG, GRID, TEXT, MUTED = '#0c131d', '#172435', '#e6edf5', '#8193a9'
CYAN, BLUE, GOLD, PURPLE = '#45dfce', '#69afff', '#f1b65f', '#bda1ff'

def font(n, mono=False):
    paths = ['/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('Mono' if mono else '') + '.ttf',
             'C:/Windows/Fonts/consola.ttf' if mono else 'C:/Windows/Fonts/arial.ttf',
             '/System/Library/Fonts/Menlo.ttc' if mono else '/System/Library/Fonts/Helvetica.ttc']
    for p in paths:
        if Path(p).exists(): return ImageFont.truetype(p, n)
    return ImageFont.load_default()

def canvas(labels, accent):
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((918, 16), 'Illustration', font=font(14), fill=MUTED)
    for p in range(3):
        x = p * 360
        for xx in range(x + 20, x + 345, 25): d.line((xx, 53, xx, 318), fill=GRID)
        for yy in range(53, 320, 25): d.line((x + 20, yy, x + 340, yy), fill=GRID)
        if p < 2: d.line((x + 350, 51, x + 350, 319), fill='#2e3c4d')
        d.text((x + 24, 339), labels[p], font=font(24), fill=accent)
    return im, d

def dot(d, x, y, c, r=1.4): d.ellipse((x-r, y-r, x+r, y+r), fill=c)

def stereo_points(objects):
    # Uniform image-plane sampling -> ground intersection and box surface hits.
    # The projected ground pattern follows camera rays, not radial scanning.
    points = []
    for row in range(100):
        for col in range(101):
            # Pixel-scale perturbation breaks artificial scan-like bands.
            y = .36 / (.06 + row * .0061 + .004 * math.sin(col*2.13+row*1.71))
            u = -.60 + 1.20 * col / 100 + .003*math.sin(col*1.17+row*2.31)
            dx, dy, dz = u, 1., -.36/y
            closest, obj = y, None
            for o in objects:
                x0, y0, x1, y1, h = o
                lo, hi = 0., closest
                for v, mn, mx in [(dx,x0,x1),(dy,y0,y1),(dz,-.36,h-.36)]:
                    if abs(v)<1e-8:
                        if not mn <= 0 <= mx: hi=-1
                    else:
                        t0,t1=sorted((mn/v,mx/v));lo=max(lo,t0);hi=min(hi,t1)
                if hi >= lo and 0 < lo < closest: closest,obj=lo,o
            x, yy = dx*closest, closest
            # Spatially correlated missing observations; fixed across frames.
            gap = math.sin(x*5.1+yy*.7)*math.cos(yy*3.4-x*.3)
            if yy < .48 or yy > 6 or (gap>.38 and obj is None) or (gap>.75 and obj): continue
            if yy>3.9 and (col+row)%3 == 0: continue
            # A few thin-object returns are deliberately sparse for the illustration.
            if obj and obj[4]<.1 and col%6: continue
            points.append((x,yy,.36+dz*closest,obj))
    return points

def rectangle(d, m, box, c, width=2):
    x0,y0,x1,y1=box[:4];ps=[m(x0,y0),m(x1,y0),m(x1,y1),m(x0,y1)]
    d.line(ps+[ps[0]],fill=c,width=width)

def make_stereo(phase):
    im,d=canvas(['Observation','Geometry','Representation'],CYAN)
    shift=.15*math.sin(phase)
    objects=[(-1.2+shift,2.7,-.35+shift,3.4,.7),(.85,4.3,1.75,4.9,1.1),(.1,1.4,.95,1.48,.04)]
    pts=stereo_points(objects)
    for p in range(3):
        m=lambda x,y:(180+360*p+x*43,313-y*43)
        near,far=.48,6.
        frustum=[m(-.6*near,near),m(-.6*far,far),m(.6*far,far),m(.6*near,near)]
        d.polygon(frustum,outline='#345260')
        for x,y,z,o in pts:
            c='#476677' if not o else '#a2bac3'
            if p>0:c='#345060' if not o else (GOLD if o[4]<.1 else CYAN)
            dot(d,*m(x,y),c,.8 if not o else 1.4)
        sx,sy=m(0,0);d.polygon([(sx,sy-9),(sx-6,sy+1),(sx+6,sy+1)],fill=CYAN)
        if p==2:
            for o in objects[:2]:rectangle(d,m,o,CYAN)
            # Conceptual completed thin-obstacle representation; not an algorithm replay.
            o=objects[2]
            for k in range(27):dot(d,*m(o[0]+(o[2]-o[0])*k/26,o[1]),GOLD,2)
            x,y=m(o[0],o[1]);d.line((x,y-12,x+40,y-12),fill=GOLD,width=1)
    return im

def ray_hit(angle, objects, limit=4):
    dx,dy=math.sin(angle),math.cos(angle);best=limit;obj=None
    for o in objects:
        if o['type']=='circle':
            x,y,rad=o['shape'];b=dx*x+dy*y;disc=b*b-(x*x+y*y-rad*rad)
            r=b-math.sqrt(disc) if disc>=0 and b>0 else limit
        else:
            x0,y0,x1,y1=o['shape'];lo,hi=0.,limit
            for v,mn,mx in [(dx,x0,x1),(dy,y0,y1)]:
                if abs(v)<1e-8:
                    if not mn<=0<=mx:hi=-1
                else:
                    q0,q1=sorted((mn/v,mx/v));lo=max(lo,q0);hi=min(hi,q1)
            r=lo if hi>=lo and hi>0 else limit
        if 0<r<best:best,obj=r,o
    return best,obj

def make_lidar(phase):
    im,d=canvas(['Returns','Height','Tracks'],BLUE)
    tx,ty=.5+1.25*math.sin(phase),.7+.65*math.cos(phase)
    obs=[dict(type='box',shape=(-3,1.25,-2.8,3.2),id='fence'),
         dict(type='box',shape=(1.3,-2.8,3.1,-2.55),id='edge'),
         dict(type='box',shape=(-2.8,-1.5,-.9,-1.25),id='elevated'),
         dict(type='circle',shape=(2.45,2.25,.52),id='tree'),
         dict(type='circle',shape=(-.9,2.8,.44),id='shrub'),
         dict(type='circle',shape=(2.85,-.6,.45),id='shrub'),
         dict(type='circle',shape=(-2.55,-.05,.3),id='shrub'),
         dict(type='circle',shape=(tx,ty,.32),id='moving')]
    points=[]
    for k in range(240):
        angle=k*math.tau/240;r,o=ray_hit(angle,obs)
        if o:
            # Small deterministic range perturbation, with discrete angular sampling.
            r+=.012*math.sin(k*2.3)
            points.append((math.sin(angle)*r,math.cos(angle)*r,o))
    for p in range(3):
        m=lambda x,y:(180+360*p+x*31,185-y*31)
        cx,cy=m(0,0)
        for radius in [2,4]:d.ellipse((cx-radius*31,cy-radius*31,cx+radius*31,cy+radius*31),outline='#284157')
        # A few visible beam directions end at the first surface, never behind it.
        if p==0:
            for k in range(0,240,15):
                angle=k*math.tau/240;r,o=ray_hit(angle,obs)
                if o:d.line((cx,cy,*m(math.sin(angle)*r,math.cos(angle)*r)),fill='#23384c')
        for x,y,o in points:
            c='#98b8d0' if p==0 else GOLD if o['id']=='elevated' else BLUE if o['id']=='moving' else '#7194b1'
            dot(d,*m(x,y),c,1.65)
        dot(d,cx,cy,TEXT,4);d.line((cx,cy,cx,cy-12),fill=TEXT,width=2)
        if p==1:
            # Compact height glyph, without an explanatory sentence inside the image.
            x,y=m(-2.8,-1.5);d.line((x-8,y-15,x-8,y+5),fill=GOLD,width=2)
            d.line((x-12,y-15,x-4,y-15),fill=GOLD);d.line((x-12,y+5,x-4,y+5),fill=GOLD)
        if p==2:
            trail=[m(.5+1.25*math.sin(phase-j*.045),.7+.65*math.cos(phase-j*.045)) for j in reversed(range(35))]
            d.line(trail,fill='#446f99',width=2)
            x,y=m(tx,ty);d.rectangle((x-16,y-16,x+16,y+16),outline=BLUE,width=2)
            d.text((x-18,y-39),'07',font=font(18,True),fill=TEXT)
    return im

def make_collision(phase):
    im,d=canvas(['Candidates','Hierarchy','Convex query'],GOLD)
    xs=[45,130+35*math.sin(phase),245]
    overlap=xs[1]<xs[0]+85
    for i,x in enumerate(xs):
        c=GOLD if (i<2 and overlap) else '#8193a9'
        d.rectangle((x,115+i*12,x+85,200+i*12),outline=c,width=2)
        d.line((x,276,x+85,276),fill=c,width=4)
    # A query descends a schematic hierarchy.
    boxes=[(388,80,685,293),(402,103,526,279),(546,103,672,279),(414,127,458,183),(468,210,513,264),(559,133,604,193),(620,211,660,266)]
    selected=int((phase/math.tau)*4)%4
    for i,b in enumerate(boxes):d.rectangle(b,outline=GOLD if i==0 or i==1+selected//2 or i==3+selected else '#496176',width=2)
    delta=25*math.sin(phase)
    a=[(741,218),(782,118),(839,144),(847,241)];b=[(897+delta,123),(1004+delta,151),(989+delta,247),(898+delta,225)]
    d.polygon(a,outline=GOLD,width=2);d.polygon(b,outline=TEXT,width=2)
    d.line((841,185,897+delta,185),fill=GOLD,width=2);dot(d,841,185,GOLD,4);dot(d,897+delta,185,GOLD,4)
    return im

def make_motion(phase):
    im,d=canvas(['Pose','Alignment','Motion'],PURPLE)
    progress=phase/math.tau;cy=231-progress*95;cx=169+20*math.sin(phase)
    for x,y in [(72,245),(250,215),(111,173),(267,128),(174,76)]:dot(d,x,y,'#665780',5)
    d.rectangle((42,cy-43,315,cy+79),outline='#594c75')
    joints=[(cx,cy-22),(cx,cy),(cx-27,cy+14),(cx+31,cy-19),(cx,cy+35),(cx-24,cy+65),(cx+26,cy+60)]
    for i,j in [(0,1),(1,2),(1,3),(1,4),(4,5),(4,6)]:d.line((*joints[i],*joints[j]),fill=PURPLE,width=3)
    for x,y in joints:dot(d,x,y,TEXT,4)
    # A moving local video frame maps to a fixed window in wall-template space.
    # Reference correspondences are synthetic, not recovered research results.
    d.text((386,77),'Frame',font=font(16),fill=MUTED)
    d.text((552,52),'Template',font=font(16),fill=MUTED)
    d.rectangle((550,77,687,305),outline='#665780',width=2)
    for x,y in [(570,92),(657,98),(580,284),(656,268)]:dot(d,x,y,'#665780',4)
    refs=[(578,133),(650,166),(599,224)]
    window=(563,114,675,249)
    d.rectangle(window,outline=PURPLE,width=2)
    theta=.10*math.sin(phase);cx=437;cy=180+9*math.cos(phase)
    def local(u,v):
        x,y=(u-.5)*97,(v-.5)*135
        return (cx+x*math.cos(theta)-y*math.sin(theta),
                cy+x*math.sin(theta)+y*math.cos(theta))
    corners=[local(0,0),local(1,0),local(1,1),local(0,1)]
    d.line(corners+[corners[0]],fill=PURPLE,width=2)
    for x,y in refs:
        sx,sy=local((x-window[0])/(window[2]-window[0]),
                    (y-window[1])/(window[3]-window[1]))
        # Dashed links distinguish correspondences from motion trajectories.
        for k in range(0,20,2):
            t0,t1=k/20,(k+1)/20
            d.line((sx+(x-sx)*t0,sy+(y-sy)*t0,
                    sx+(x-sx)*t1,sy+(y-sy)*t1),fill='#88729f',width=1)
        dot(d,sx,sy,GOLD,4);dot(d,x,y,GOLD,4)
    n=max(2,int(progress*72)+1)
    d.line((752,286,1045,286),fill=MUTED);d.line((752,82,752,286),fill=MUTED)
    curve=[(755+i*4,220-65*math.sin(i/72*math.tau)**2-17*math.sin(i/72*math.tau*3)) for i in range(73)]
    d.line(curve,fill=PURPLE,width=3);x,y=curve[min(72,n-1)];d.line((x,87,x,286),fill='#665780');dot(d,x,y,TEXT,4)
    return im

if __name__=='__main__':
    OUT.mkdir(exist_ok=True)
    for name,render in [('stereo',make_stereo),('lidar',make_lidar),('collision',make_collision),('motion',make_motion)]:
        frames=[render(i/72*math.tau) for i in range(72)]
        frames[0].save(OUT/(name+'.gif'),save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=True)
        frames[24].save(OUT/(name+'-preview.png'))
        print(name,(OUT/(name+'.gif')).stat().st_size)

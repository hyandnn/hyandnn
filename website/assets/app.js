/* Independent conceptual scenes. No product data or production implementation. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const colors = { grid:'#1a2936', muted:'#879cac', point:'#7892a6', cyan:'#62e4d2', blue:'#85bbff', gold:'#f3bf77', text:'#dce7ef' };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [];
  const language = document.documentElement?.dataset.language === 'zh' ? 'zh' : 'en';
  const tr = (en,zh) => language==='zh'?zh:en;
  const canvasFont = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei","Source Han Sans SC","Noto Sans SC","Noto Sans CJK SC",sans-serif';
  // Preferences are best-effort: local previews can block browser storage.
  const storage = { get(){try{return localStorage.getItem('merci-language');}catch{return null;}}, set(v){try{localStorage.setItem('merci-language',v);}catch{}} };
  function navigateLanguage(href){
    if(window.parent!==window&&document.URL==='about:srcdoc')window.parent.postMessage({portfolioNavigation:href},'*');
    else window.location.assign(href);
  }
  const languageLinks=[...document.querySelectorAll('[data-set-language]')];
  for(const a of languageLinks)a.addEventListener('click',()=>{storage.set(a.dataset.setLanguage);if(window.location.hash)a.href+=window.location.hash;});
  const preferred=storage.get();
  // Only explicit saved choices redirect; a shared language URL works on first visit.
  if(preferred&&preferred!==language){const link=languageLinks.find(a=>a.dataset.setLanguage===preferred);if(link)navigateLanguage(link.getAttribute('href'));}

  const boxHit = (dx,dy,dz,box,limit) => {
    let lo=0, hi=limit;
    const axes = [[dx,box[0],box[2]],[dy,box[1],box[3]]];
    if(dz !== null) axes.push([dz,-.36,box[4]-.36]);
    for(const [v,mn,mx] of axes){
      if(Math.abs(v)<1e-8){if(!(mn<=0&&0<=mx))return null;}
      else{let a=mn/v,b=mx/v;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);}
    }
    return hi>=lo&&lo>0&&lo<limit?lo:null;
  };
  function stereoData(t){
    const shift=.09*Math.sin(t*TAU);
    const boxes=[[-1.2+shift,2.7,-.35+shift,3.4,.7],[.85,4.3,1.75,4.9,1.1],[.1,1.4,.95,1.48,.04]];
    const points=[];
    for(let row=0;row<95;row++)for(let col=0;col<110;col++){
      const distance=.36/(.06+row*.0063+.004*Math.sin(col*2.13+row*1.71));
      const dx=-.60+1.2*col/109+.003*Math.sin(col*1.17+row*2.31),dz=-.36/distance;
      let nearest=distance, object=-1;
      boxes.forEach((b,i)=>{const hit=boxHit(dx,1,dz,b,nearest);if(hit!==null){nearest=hit;object=i;}});
      const x=dx*nearest,y=nearest,z=.36+dz*nearest;
      const gap=Math.sin(x*5.1+y*.7)*Math.cos(y*3.4-x*.3);
      if(y<.48||y>6||(gap>.38&&object<0)||(gap>.75&&object>=0))continue;
      if(y>3.9&&(row+col)%3===0)continue;
      if(object===2&&col%6!==0)continue;
      points.push({x,y,z,object});
    }
    return {boxes,points};
  }
  function rayHit(angle,objects,limit=4){
    const dx=Math.sin(angle),dy=Math.cos(angle);let nearest=limit,object=null;
    for(const o of objects){
      let hit=null;
      if(o.type==='circle'){
        const [x,y,r]=o.shape,b=dx*x+dy*y,disc=b*b-(x*x+y*y-r*r);
        if(disc>=0&&b>0)hit=b-Math.sqrt(disc);
      }else hit=boxHit(dx,dy,null,o.shape,nearest);
      if(hit!==null&&hit>0&&hit<nearest){nearest=hit;object=o;}
    }
    return {distance:nearest,object,dx,dy};
  }
  function targetAt(t){return [1.65*Math.sin(t*TAU),1.65+.15*Math.cos(t*TAU)];}
  function lidarData(t){
    const target=targetAt(t);
    const objects=[{type:'box',shape:[-.45,.8,.45,1.05],id:'occluder'},
      {type:'box',shape:[-3.2,1,-3,2.2],id:'fence'},
      {type:'box',shape:[1.5,-2.8,3,-2.55],id:'edge'},
      {type:'box',shape:[-2.8,-1.5,-.9,-1.25],id:'overhang'},
      {type:'circle',shape:[2.5,2.25,.5],id:'tree'},
      {type:'circle',shape:[-.9,3,.42],id:'shrub'},
      {type:'circle',shape:[2.8,-.5,.5],id:'shrub'},
      {type:'circle',shape:[-2.55,-.05,.3],id:'shrub'},
      {type:'circle',shape:[...target,.23],id:'target'}];
    const rays=[];
    for(let k=0;k<360;k++){
      const ray=rayHit(k*TAU/360,objects);
      // Tiny deterministic range perturbation, never free-space random scatter.
      const d=ray.distance+(ray.object?.id==='target'?0:.008*Math.sin(k*2.3));
      rays.push({...ray,x:ray.dx*d,y:ray.dy*d,k});
    }
    const visible=rays.some(r=>r.object?.id==='target');
    return {objects,rays,target,visible};
  }
  function line(ctx,points,color,width=1,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.setLineDash([]);}
  function dot(ctx,x,y,color,r=1.5){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
  function text(ctx,label,x,y,color=colors.muted,size=14){ctx.font=`${size}px ${canvasFont}`;ctx.fillStyle=color;ctx.fillText(label,x,y);}
  function outline(ctx,map,b,color,width=1){line(ctx,[map(b[0],b[1]),map(b[2],b[1]),map(b[2],b[3]),map(b[0],b[3]),map(b[0],b[1])],color,width);}
  function robot(ctx,map,color){const [x,y]=map(0,0);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x-6,y+4);ctx.lineTo(x+6,y+4);ctx.closePath();ctx.fill();}
  function plotFrame(ctx,w,h,kind,panel,panels){
    const left=panel*w/panels,right=(panel+1)*w/panels,pw=w/panels;
    const preview=h<290;
    let scale,cx,cy;
    if(kind==='stereo'){scale=Math.min((pw-38)/7.4,(h-70)/6.6);cx=left+pw/2;cy=h-22;}
    else{scale=Math.min((pw-40)/8.4,(h-70)/8.4);cx=left+pw/2;cy=(h+32)/2;}
    const map=(x,y)=>[cx+x*scale,cy-y*scale];
    ctx.save();ctx.beginPath();ctx.rect(left+1,45,pw-2,h-46);ctx.clip();
    for(let x=-4;x<=4;x++){line(ctx,[map(x,kind==='stereo'?0:-4),map(x,kind==='stereo'?6:4)],colors.grid);}
    for(let y=kind==='stereo'?0:-4;y<=(kind==='stereo'?6:4);y++)line(ctx,[map(-4,y),map(4,y)],colors.grid);
    ctx.restore();
    if(panel)line(ctx,[[left,20],[left,h-15]],'#263a49');
    if(!preview){text(ctx,panels===1?tr('Top view','俯视图'):panel?tr('Representation','几何表示'):tr('Observations','观测点'),left+22,29,colors.text,16);}
    else text(ctx,kind==='stereo'?tr('FORWARD / STEREO','前向 / 双目'):tr('RETURNS + TRACK','回波 + 轨迹'),left+20,27,colors.muted,13);
    return {map,scale,left,pw,preview};
  }
  function drawStereo(scene){
    const {ctx,w,h,t,layers,preview}=scene,panels=!preview&&w>=720?2:1;
    const {boxes,points}=stereoData(t);
    for(let panel=0;panel<panels;panel++){
      const {map,scale,left,pw}=plotFrame(ctx,w,h,'stereo',panel,panels);
      const frustum=[map(-.6*.48,.48),map(-3.6,6),map(3.6,6),map(.6*.48,.48)];
      ctx.fillStyle='#13253255';ctx.beginPath();frustum.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();line(ctx,[...frustum,frustum[0]],'#365766');
      const geometry=layers.geometry&&(panels===1||panel===1);
      if(layers.points)for(const p of points){const [x,y]=map(p.x,p.y);dot(ctx,x,y,p.object<0?'#466677':geometry?p.object===2?colors.gold:colors.cyan:'#a7bdc7',p.object<0?(preview?.65:.85):(preview?1:1.3));}
      if(geometry){
        boxes.slice(0,2).forEach(b=>outline(ctx,map,b,colors.cyan,1.7));
        const b=boxes[2];line(ctx,[map(b[0],b[1]),map(b[2],b[1])],colors.gold,3,[4,3]);
        if(!preview){const [x,y]=map(b[2],b[1]);line(ctx,[[x+6,y],[x+18,y-16]],colors.gold);const label=tr('Inferred thin geometry','细小障碍物推断');text(ctx,label,Math.max(left+10,Math.min(x+20,left+pw-(language==='zh'?145:165))),y-21,colors.gold,14);}
      }
      robot(ctx,map,colors.cyan);
      if(!preview){const [x,y]=map(-2.3,5.7);text(ctx,tr('Gaps & occlusion','缺失与遮挡'),x,y,colors.muted,13);}
    }
  }
  function drawLidar(scene){
    const {ctx,w,h,t,layers,preview}=scene,panels=!preview&&w>=720?2:1;
    const data=lidarData(t);
    for(let panel=0;panel<panels;panel++){
      const {map,scale,left}=plotFrame(ctx,w,h,'lidar',panel,panels),[cx,cy]=map(0,0);
      for(const r of [2,4]){ctx.beginPath();ctx.strokeStyle='#2b4359';ctx.arc(cx,cy,r*scale,0,TAU);ctx.stroke();}
      if(layers.rays)for(const ray of data.rays){if(ray.k%10===0)line(ctx,[[cx,cy],map(ray.x,ray.y)],ray.object?'#243e56':'#172837');}
      if(layers.points)for(const ray of data.rays){if(ray.object)dot(ctx,...map(ray.x,ray.y),ray.object.id==='target'?colors.blue:ray.object.id==='overhang'?colors.gold:'#90abc2',preview?1.2:1.6);}
      // Ghost outlines describe scene geometry, not unobserved sensor returns.
      for(const o of data.objects){if(o.type==='box')outline(ctx,map,o.shape,'#3e526188',1);}
      const tracking=layers.tracks&&(panels===1||panel===1);
      if(tracking){
        const path=[];for(let k=45;k>=0;k--)path.push(map(...targetAt(t-k*.002)));
        line(ctx,path,'#507797',2);
        const [tx,ty]=map(...data.target);
        ctx.strokeStyle=colors.blue;ctx.lineWidth=1.7;ctx.setLineDash(data.visible?[]:[4,4]);ctx.strokeRect(tx-14,ty-14,28,28);ctx.setLineDash([]);
        if(!data.visible)line(ctx,path.slice(-12),colors.blue,2,[4,4]);
        if(!preview)text(ctx,data.visible?tr('Track 07','目标 07'):tr('Track 07 · occluded','目标 07 · 遮挡'),tx-30,ty-23,colors.blue,14);
      }
      robot(ctx,map,colors.text);
      if(!preview){const [x,y]=map(-2.8,-1.5);text(ctx,tr('Height structure','高度结构'),Math.max(left+10,x-18),y+24,colors.gold,13);}
    }
  }
  function drawHero(scene){
    const {ctx,w,h}=scene;
    const scale=Math.min(w/9.1,h/6),cx=w*.34,cy=h*.85;
    const iso=(x,y,z=0)=>[cx+(x*.87+y*.39)*scale,cy-(y*.53-x*.23+z)*scale];
    for(let x=-3;x<=3;x++)line(ctx,[iso(x,0),iso(x,6)],'#223747');
    for(let y=0;y<=6;y++)line(ctx,[iso(-3,y),iso(3,y)],'#223747');
    const {boxes,points}=stereoData(.15);
    for(const p of points){dot(ctx,...iso(p.x,p.y,p.z),p.object<0?'#385568':colors.cyan,p.object<0?.8:1.2);}
    for(const b of boxes.slice(0,2)){
      const bottom=[[b[0],b[1],0],[b[2],b[1],0],[b[2],b[3],0],[b[0],b[3],0]];
      const top=bottom.map(p=>[p[0],p[1],b[4]]);
      line(ctx,[...top,top[0]].map(p=>iso(...p)),colors.cyan,1.5);
      line(ctx,[...bottom,bottom[0]].map(p=>iso(...p)),'#3e867f',1);
      bottom.forEach((p,i)=>line(ctx,[iso(...p),iso(...top[i])],'#3e867f'));
    }
    const thin=boxes[2];line(ctx,[iso(thin[0],thin[1],.04),iso(thin[2],thin[1],.04)],colors.gold,2,[3,3]);
    const origin=iso(0,0);dot(ctx,...origin,colors.text,4);line(ctx,[origin,iso(0,.5)],colors.text,2);
    text(ctx,tr('SCENE GEOMETRY','场景几何'),22,30,colors.cyan,13);
    text(ctx,tr('Supporting surface','支撑平面'),22,h-22,colors.muted,13);
  }
  function grid(ctx,w,h,step=28){for(let x=18;x<w;x+=step)line(ctx,[[x,45],[x,h-18]],colors.grid);for(let y=45;y<h-18;y+=step)line(ctx,[[18,y],[w-18,y]],colors.grid);}
  function polygon(ctx,points,color,fill){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.stroke();}
  function drawStereoCover(scene){
    const {ctx,w,h}=scene;grid(ctx,w,h);
    const sx=(w-76)/1.7,sy=(h-70)/1.5,map=(x,y)=>[38+(x+.25)*sx,h-22-(y-.6)*sy];
    ctx.save();ctx.beginPath();ctx.rect(18,45,w-36,h-63);ctx.clip();
    for(const p of stereoData(.2).points){if(p.x>=-.25&&p.x<=1.45&&p.y>=.6&&p.y<=2.1)dot(ctx,...map(p.x,p.y),p.object===2?colors.gold:'#476877',p.object===2?2:1);}
    line(ctx,[map(.1,1.4),map(.95,1.4)],colors.gold,3,[6,5]);ctx.restore();
    text(ctx,tr('SPARSE POINTS / GEOMETRY','稀疏观测 / 推断几何'),20,27,colors.cyan,13);
    const [x,y]=map(.45,1.4);text(ctx,tr('Thin obstacle','细小障碍物'),Math.max(20,x-35),y-16,colors.gold,14);
  }
  function collisionShapes(t){return [[.26+.04*Math.sin(t*TAU),.45,.25,.29],[.46,.48,.25,.29],[.78,.32,.19,.23],[.76,.76,.16,.16]];}
  function drawCollision(scene){
    const {ctx,w,h,t}=scene,panel=scene.panel||0;grid(ctx,w,h);
    const map=(x,y)=>[22+x*(w-44),h-30-y*(h-82)];
    if(panel===0){
      text(ctx,tr('POTENTIAL PAIRS','潜在对象对'),20,28,colors.gold,13);
      const shapes=collisionShapes(t);
      shapes.forEach((b,i)=>{const [x,y,bw,bh]=b,p=[map(x-bw/2,y-bh/2),map(x+bw/2,y-bh/2),map(x+bw/2,y+bh/2),map(x-bw/2,y+bh/2)];polygon(ctx,p,i<2?colors.gold:'#607d90',i<2?'#f3bf7712':'#40576910');
        const inner=p.map(([px,py])=>[(px+map(x,y)[0])/2,(py+map(x,y)[1])/2]);polygon(ctx,inner,i<2?'#c1a57f':'#627a8a');
      });
      const a=shapes[0],b=shapes[1];line(ctx,[map(a[0],a[1]),map(b[0],b[1])],colors.gold,2,[4,4]);
      const base=h-22;line(ctx,[[30,base],[w-28,base]],'#507082');
      shapes.slice(0,3).forEach((s,i)=>{const x0=map(s[0]-s[2]/2,0)[0],x1=map(s[0]+s[2]/2,0)[0];line(ctx,[[x0,base-6-i*6],[x1,base-6-i*6]],i<2?colors.gold:'#607d90',3);});
    }else if(panel===1){
      text(ctx,tr('HIERARCHICAL BOUNDS','层次包围结构'),20,28,colors.gold,13);
      const root=[map(.1,.1),map(.9,.1),map(.9,.92),map(.1,.92)];line(ctx,[...root,root[0]],'#557083',1,[4,4]);
      for(let i=0;i<2;i++){
        const x0=.17+i*.37,x1=x0+.29;const b=[map(x0,.18),map(x1,.18),map(x1,.84),map(x0,.84)];polygon(ctx,b,i===0?colors.gold:'#577284',i===0?'#f3bf7709':undefined);
        for(let j=0;j<3;j++){const y=.27+j*.22;const tri=[map(x0+.035,y),map(x1-.025,y+.12),map(x0+.08,y+.17)];polygon(ctx,tri,i===0&&j===1?colors.gold:'#597485');}
      }
      text(ctx,tr('Selected region','选中的几何区域'),22,h-9,colors.muted,13);
    }else{
      text(ctx,tr('CONVEX GEOMETRY QUERY','凸几何查询'),20,28,colors.gold,13);
      const a=[[.12,.35],[.30,.22],[.43,.4],[.32,.62],[.13,.62]].map(p=>map(...p));
      const b=[[.60,.31],[.84,.34],[.87,.64],[.68,.73],[.54,.53]].map(p=>map(...p));
      polygon(ctx,a,colors.gold,'#f3bf7710');polygon(ctx,b,'#9cadbd','#94aabd0a');
      const pa=a.reduce((best,p)=>p[0]>best[0]?p:best),pb=b.reduce((best,p)=>p[0]<best[0]?p:best);
      dot(ctx,...pa,colors.gold,4);dot(ctx,...pb,colors.gold,4);line(ctx,[pa,pb],colors.gold,1.5,[4,4]);
      line(ctx,[map(.18,.12),map(.80,.12)],'#9a815d',1);
      text(ctx,tr('Support direction','支撑查询方向'),22,h-9,colors.muted,13);
    }
  }
  // The world holds are immutable. Only the camera window and climber move.
  const wallHolds=Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({id:i+1,x:[.17,.48,.81][i%3]+.035*Math.sin(i*1.9),y:.055+Math.floor(i/3)*.125+.017*Math.sin(i*2.1)})));
  function climberAt(t){return [.47+.05*Math.sin(t*TAU*2),.15+.67*t+.008*Math.sin(t*TAU*2)];}
  function speedAt(t){const c=Math.cos(t*TAU*2);return Math.hypot(.05*TAU*2*c,.67+.008*TAU*2*c)/12;}
  function poseAt(t){
    const [x,y]=climberAt(t),s=.015*Math.sin(t*TAU*3);
    const p={hip:[x,y],shoulder:[x,y+.047],head:[x,y+.084],le:[x-.064,y+.04+s],lh:[x-.11,y+.088+s],re:[x+.062,y+.034-s],rh:[x+.10,y+.081-s],lk:[x-.025,y-.04+s/2],lf:[x-.06,y-.077],rk:[x+.03,y-.043-s/2],rf:[x+.061,y-.082]};
    return {points:p,edges:[['hip','shoulder'],['shoulder','head'],['shoulder','le'],['le','lh'],['shoulder','re'],['re','rh'],['hip','lk'],['lk','lf'],['hip','rk'],['rk','rf']]};
  }
  function motionData(t){
    const window={x:.05,y:.02+.66*t,w:.90,h:.30};
    const visible=wallHolds.filter(p=>p.x>=window.x&&p.x<=window.x+window.w&&p.y>=window.y&&p.y<=window.y+window.h);
    const local=p=>[(p[0]-window.x)/window.w,(p[1]-window.y)/window.h];
    return {window,holds:wallHolds,visible,local,climber:climberAt(t),pose:poseAt(t),matches:[visible[0],visible[Math.floor(visible.length/2)],visible[visible.length-1]].filter(Boolean)};
  }
  function drawPose(ctx,map,pose,width=2){for(const [a,b] of pose.edges)line(ctx,[map(...pose.points[a]),map(...pose.points[b])],'#e4e1ef',width);dot(ctx,...map(...pose.points.head),'#e4e1ef',width*1.6);dot(ctx,...map(...pose.points.hip),colors.purple||'#c4aaff',width*1.4);}
  function drawMotion(scene){
    const {ctx,w,h,t}=scene,panel=scene.panel||0,data=motionData(t),accent='#c4aaff';
    grid(ctx,w,h);
    if(panel===0){
      text(ctx,tr('LOCAL FRAME COORDINATES','画面局部坐标'),18,28,accent,13);
      const bw=Math.min(w-48,(h-78)*.9/.78),bh=bw*.78/.9,x0=(w-bw)/2,y0=50+(h-65-bh)/2;
      const map=(x,y)=>[x0+x*bw,y0+(1-y)*bh];
      polygon(ctx,[[x0,y0],[x0+bw,y0],[x0+bw,y0+bh],[x0,y0+bh]],accent,'#c4aaff09');
      for(const p of data.visible){const match=data.matches.some(m=>m.id===p.id);dot(ctx,...map(...data.local([p.x,p.y])),match?colors.gold:'#a493bc',match?4:3);}
      drawPose(ctx,(x,y)=>map(...data.local([x,y])),data.pose,2);
    }else if(panel===1){
      const ww=Math.min(w*.25,(h-62)/2.6),wh=ww*2.6,wx=w*.71-ww/2,wy=48;
      const map=(x,y)=>[wx+x*ww,wy+(1-y)*wh];
      const fw=Math.min(w*.33,120),fh=fw*.78/.9,fx=18,fy=h*.45-fh/2;
      const localMap=(x,y)=>[fx+x*fw,fy+(1-y)*fh];
      text(ctx,tr('Frame','当前画面'),fx,fy-13,accent,14);text(ctx,tr('Fixed template','固定模板'),Math.max(wx-14,w*.50),30,accent,14);
      polygon(ctx,[[wx,wy],[wx+ww,wy],[wx+ww,wy+wh],[wx,wy+wh]],'#685b82','#c4aaff05');
      polygon(ctx,[[fx,fy],[fx+fw,fy],[fx+fw,fy+fh],[fx,fy+fh]],accent,'#c4aaff06');
      for(const p of data.holds)dot(ctx,...map(p.x,p.y),'#665e78',2.6);
      const win=data.window;
      const rect=[map(win.x,win.y),map(win.x+win.w,win.y),map(win.x+win.w,win.y+win.h),map(win.x,win.y+win.h)];
      polygon(ctx,rect,accent,'#c4aaff16');
      for(const p of data.visible)dot(ctx,...localMap(...data.local([p.x,p.y])),'#9689ad',2.4);
      for(const p of data.matches){const a=localMap(...data.local([p.x,p.y])),b=map(p.x,p.y);line(ctx,[a,b],'#b49a655f',1,[3,4]);dot(ctx,...a,colors.gold,3.5);dot(ctx,...b,colors.gold,3.5);}
      const ax=wx+ww+12;line(ctx,[[ax,wy+wh*.75],[ax,wy+wh*.40]],accent,1.3);line(ctx,[[ax-3,wy+wh*.43],[ax,wy+wh*.40],[ax+3,wy+wh*.43]],accent,1.3);
    }else{
      text(ctx,tr('Aligned trajectory','对齐后的轨迹'),18,25,accent,14);
      const top=44,bottom=h*.53,ww=Math.min(w*.32,105),wx=(w-ww)/2;
      const map=(x,y)=>[wx+x*ww,bottom-y*(bottom-top)];
      polygon(ctx,[[wx,top],[wx+ww,top],[wx+ww,bottom],[wx,bottom]],'#514b64');
      for(const p of data.holds)dot(ctx,...map(p.x,p.y),'#514b64',1.7);
      const trail=[];for(let i=0;i<=80;i++)trail.push(map(...climberAt(t*i/80)));line(ctx,trail,accent,2);dot(ctx,...map(...data.climber),colors.text,3.5);
      const gx=45,gy=h*.69,gw=w-65,gh=h*.20;
      text(ctx,tr('Speed (normalized/s)','速度（归一化坐标/秒）'),18,gy-13,accent,13);
      line(ctx,[[gx,gy],[gx,gy+gh],[gx+gw,gy+gh]],'#6b7385');
      text(ctx,'0.1',13,gy+4,colors.muted,12);text(ctx,'0',26,gy+gh+3,colors.muted,12);
      const samples=[];for(let i=0;i<=100;i++)samples.push([gx+gw*i/100,gy+gh-speedAt(i/100)/.1*gh]);line(ctx,samples,'#7d699f',1.4);
      const active=samples.slice(0,Math.floor(t*100)+1);if(active.length>1)line(ctx,active,accent,2);
      dot(ctx,gx+gw*t,gy+gh-speedAt(t)/.1*gh,colors.text,3);
      text(ctx,'0',gx-2,gy+gh+16,colors.muted,12);text(ctx,'12',gx+gw-12,gy+gh+16,colors.muted,12);
      text(ctx,tr('Synthetic time (s)','示意时间（秒）'),Math.max(gx+22,(w-140)/2),h-5,colors.muted,12);
    }
  }
  function drawMotionCover(scene){
    const {ctx,w,h}=scene,data=motionData(.42),accent='#c4aaff';grid(ctx,w,h);
    text(ctx,tr('FIXED WALL / MOVING WINDOW','固定墙点 / 移动窗口'),20,27,accent,13);
    // A dedicated composition: full template and its current camera window.
    const wh=h-62,ww=wh/2.1,wx=w*.51-ww/2,wy=45,map=(x,y)=>[wx+x*ww,wy+(1-y)*wh];
    polygon(ctx,[[wx,wy],[wx+ww,wy],[wx+ww,wy+wh],[wx,wy+wh]],'#695d82','#c4aaff05');
    for(const p of data.holds)dot(ctx,...map(p.x,p.y),data.visible.some(v=>v.id===p.id)?colors.gold:'#7e7193',2.6);
    const q=data.window;polygon(ctx,[map(q.x,q.y),map(q.x+q.w,q.y),map(q.x+q.w,q.y+q.h),map(q.x,q.y+q.h)],accent,'#c4aaff15');
    drawPose(ctx,map,data.pose,1.8);
    const [px,py]=map(.97,q.y+q.h/2);line(ctx,[[px+12,py+14],[px+12,py-18]],accent,1.4);line(ctx,[[px+9,py-15],[px+12,py-18],[px+15,py-15]],accent,1.4);
  }
  function render(scene){
    const rect=scene.canvas.getBoundingClientRect();if(rect.width===0)return;
    scene.w=rect.width;scene.h=rect.height;
    const ratio=Math.min(window.devicePixelRatio||1,2),bw=Math.round(rect.width*ratio),bh=Math.round(rect.height*ratio);
    if(scene.canvas.width!==bw||scene.canvas.height!==bh){scene.canvas.width=bw;scene.canvas.height=bh;}
    scene.ctx.setTransform(ratio,0,0,ratio,0,0);scene.ctx.clearRect(0,0,scene.w,scene.h);
    scene.t=scene.group?scene.group.t:scene.t;
    const draw={hero:drawHero,stereo:drawStereo,lidar:drawLidar,collision:drawCollision,motion:drawMotion,'stereo-cover':drawStereoCover,'lidar-cover':drawLidar,'collision-cover':drawCollision,'motion-cover':drawMotionCover}[scene.kind];
    if(draw)draw(scene);
  }
  function setPlaying(group,playing){
    group.playing=playing;
    if(group.button){group.button.textContent=playing?tr('Pause','暂停'):tr('Play','播放');group.button.setAttribute('aria-label',group.button.textContent);}
  }
  function renderGroup(group){for(const scene of group.scenes)render(scene);group.range.value=Math.round(group.t*1000);group.output.textContent=`${(group.t*12).toFixed(1)} s`;}
  const groups=[];
  for(const demo of document.querySelectorAll('[data-demo]')){
    const group={demo,t:0,playing:false,scenes:[],layers:{points:true,geometry:true,rays:true,tracks:true},button:demo.querySelector('[data-play]'),range:demo.querySelector('[data-time]'),output:demo.querySelector('[data-time-label]')};
    groups.push(group);setPlaying(group,false);
    group.button.addEventListener('click',()=>setPlaying(group,!group.playing));
    group.range.addEventListener('input',()=>{setPlaying(group,false);group.t=Number(group.range.value)/1000;renderGroup(group);});
    for(const input of demo.querySelectorAll('[data-layer]'))input.addEventListener('change',()=>{group.layers[input.dataset.layer]=input.checked;renderGroup(group);});
  }
  for(const canvas of document.querySelectorAll('canvas[data-scene]')){
    const group=groups.find(g=>g.demo===canvas.closest('[data-demo]'));
    const scene={canvas,ctx:canvas.getContext('2d'),kind:canvas.dataset.scene,panel:Number(canvas.dataset.panel||0),preview:canvas.dataset.preview==='true',t:.25,layers:group?.layers||{points:true,geometry:true,rays:true,tracks:true},visible:true,group};
    if(group)group.scenes.push(scene);scenes.push(scene);render(scene);
  }
  const resize=new ResizeObserver(entries=>{for(const entry of entries){const scene=scenes.find(s=>s.canvas===entry.target);if(scene)render(scene);}});
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const scene=scenes.find(s=>s.canvas===entry.target);if(scene)scene.visible=entry.isIntersecting;}});
  scenes.forEach(s=>{resize.observe(s.canvas);observer.observe(s.canvas);});groups.forEach(renderGroup);
  let previous=0;
  function animate(now){
    if(now-previous>=32){const dt=previous?Math.min((now-previous)/1000,.1):0;previous=now;
      if(!document.hidden)for(const group of groups)if(group.playing&&group.scenes.some(s=>s.visible)){group.t+=dt/12;if(group.t>=1){group.t=1;setPlaying(group,false);}renderGroup(group);}
    }
    requestAnimationFrame(animate);
  }
  // One upward scan finishes at the top; no artificial downward reset.
  for(const group of groups)group.button.addEventListener('click',()=>{if(group.playing&&group.t>=1){group.t=0;renderGroup(group);}});
  if(groups.length)requestAnimationFrame(animate);
  reduced.addEventListener('change',e=>{if(e.matches)groups.forEach(g=>setPlaying(g,false));});
})();

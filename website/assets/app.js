/* Independent conceptual scenes. No product data or production implementation. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const colors = { grid:'#1a2936', muted:'#879cac', point:'#7892a6', cyan:'#62e4d2', blue:'#85bbff', gold:'#f3bf77', text:'#dce7ef' };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [];
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
  function text(ctx,label,x,y,color=colors.muted,size=14){ctx.font=`${size}px "Segoe UI",Arial,sans-serif`;ctx.fillStyle=color;ctx.fillText(label,x,y);}
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
    if(!preview){text(ctx,panels===1?'Top view':panel?'Representation':'Observations',left+22,29,colors.text,16);}
    else text(ctx,kind==='stereo'?'FORWARD / STEREO':'SURROUND / LiDAR',left+20,27,colors.muted,13);
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
        if(!preview){const [x,y]=map(b[2],b[1]);line(ctx,[[x+6,y],[x+18,y-16]],colors.gold);text(ctx,'Thin-obstacle hypothesis',Math.min(x+20,left+pw-190),y-21,colors.gold,14);}
      }
      robot(ctx,map,colors.cyan);
      if(!preview){const [x,y]=map(-2.3,5.7);text(ctx,'Surface gaps & occlusion',x,y,colors.muted,13);}
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
        if(!preview)text(ctx,data.visible?'Track 07':'Track 07 · occluded',tx-30,ty-23,colors.blue,14);
      }
      robot(ctx,map,colors.text);
      if(!preview){const [x,y]=map(-2.8,-1.5);text(ctx,'Height structure',Math.max(left+10,x-18),y+24,colors.gold,13);}
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
    text(ctx,'SCENE GEOMETRY',22,30,colors.cyan,13);
    text(ctx,'Supporting surface',22,h-22,colors.muted,13);
  }
  function render(scene){
    const rect=scene.canvas.getBoundingClientRect();if(rect.width===0)return;
    scene.w=rect.width;scene.h=rect.height;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const bw=Math.round(rect.width*ratio),bh=Math.round(rect.height*ratio);
    if(scene.canvas.width!==bw||scene.canvas.height!==bh){scene.canvas.width=bw;scene.canvas.height=bh;}
    scene.ctx.setTransform(ratio,0,0,ratio,0,0);scene.ctx.clearRect(0,0,scene.w,scene.h);
    if(scene.kind==='hero')drawHero(scene);else if(scene.kind==='stereo')drawStereo(scene);else drawLidar(scene);
    if(scene.range)scene.range.value=Math.round(scene.t*1000);
    if(scene.output)scene.output.textContent=`${(scene.t*12).toFixed(1)} s`;
  }
  function setPlaying(scene,playing){
    scene.playing=playing;
    if(scene.button){scene.button.textContent=playing?'Pause':'Play';scene.button.setAttribute('aria-pressed',String(!playing));}
  }
  for(const canvas of document.querySelectorAll('canvas[data-scene]')){
    const demo=canvas.closest('[data-demo]'),preview=canvas.dataset.preview==='true';
    const scene={canvas,ctx:canvas.getContext('2d'),kind:canvas.dataset.scene,preview,t:preview?.18:.05,layers:{points:true,geometry:true,rays:true,tracks:true},playing:!!demo&&!reduced.matches,visible:true};
    if(demo){
      scene.button=demo.querySelector('[data-play]');scene.range=demo.querySelector('[data-time]');scene.output=demo.querySelector('[data-time-label]');
      setPlaying(scene,scene.playing);
      scene.button.addEventListener('click',()=>setPlaying(scene,!scene.playing));
      scene.range.addEventListener('input',()=>{setPlaying(scene,false);scene.t=Number(scene.range.value)/1000;render(scene);});
      for(const input of demo.querySelectorAll('[data-layer]'))input.addEventListener('change',()=>{scene.layers[input.dataset.layer]=input.checked;render(scene);});
    }
    scenes.push(scene);render(scene);
  }
  const resize=new ResizeObserver(entries=>{for(const entry of entries){const scene=scenes.find(s=>s.canvas===entry.target);if(scene)render(scene);}});
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const scene=scenes.find(s=>s.canvas===entry.target);if(scene)scene.visible=entry.isIntersecting;}});
  scenes.forEach(s=>{resize.observe(s.canvas);observer.observe(s.canvas);});
  let previous=0;
  function animate(now){
    const dt=previous?Math.min((now-previous)/1000,.06):0;previous=now;
    if(!document.hidden)for(const scene of scenes){if(scene.playing&&scene.visible){scene.t=(scene.t+dt/12)%1;render(scene);}}
    requestAnimationFrame(animate);
  }
  if(scenes.some(s=>s.button))requestAnimationFrame(animate);
  const mediaDemos=[];
  for(const demo of document.querySelectorAll('[data-media-demo]')){
    const button=demo.querySelector('button'),img=demo.querySelector('img');
    button.addEventListener('click',()=>{const playing=button.getAttribute('aria-pressed')!=='true';img.src=playing?img.dataset.motion:img.dataset.static;button.setAttribute('aria-pressed',String(playing));button.textContent=playing?'Show still frame':'Play illustration';});
    mediaDemos.push({button,img});
  }
  reduced.addEventListener('change',e=>{if(e.matches){scenes.forEach(s=>setPlaying(s,false));mediaDemos.forEach(({button,img})=>{img.src=img.dataset.static;button.setAttribute('aria-pressed','false');button.textContent='Play illustration';});}});
})();

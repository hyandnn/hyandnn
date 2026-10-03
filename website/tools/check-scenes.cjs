// Canvas-only checks for environments without a browser binary.
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf','Segoe UI');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'qa');fs.mkdirSync(out,{recursive:true});
const calls=[];
const mockDocument={querySelectorAll:()=>[],hidden:false};
const context={document:mockDocument,window:{matchMedia:()=>({matches:false,addEventListener(){}}),devicePixelRatio:1},ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},requestAnimationFrame(){}};
vm.createContext(context);
const src=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').replace(/\}\)\(\);\s*$/, 'globalThis.qa={stereoData,lidarData,rayHit,drawStereo,drawLidar,drawHero,drawStereoCover,drawMotionCover,drawMotion,drawCollision,motionData,climberAt,speedAt,setPlaying,render};})();');
vm.runInContext(src,context);const qa=context.qa;
function assert(ok,message){if(!ok)throw new Error(message);}
// Independent geometric checks: free space is not a return, and first surfaces occlude farther ones.
const empty=qa.rayHit(0,[]);assert(empty.object===null,'Free-space fabricated a return');
const front={type:'box',shape:[-.5,1,.5,1.1],id:'near'},back={type:'box',shape:[-.5,2,.5,2.1],id:'far'};
const hit=qa.rayHit(0,[back,front]);assert(hit.object.id==='near'&&Math.abs(hit.distance-1)<1e-6,'First-surface occlusion failed');
assert(!qa.lidarData(.5).visible,'Occluded target should not produce returns');assert(qa.lidarData(.25).visible,'Exposed target should be visible');
for(const p of qa.stereoData(.2).points){assert(p.y>=.48&&p.y<=6,'Stereo depth range');assert(Math.abs(p.x/p.y)<=.61,'Stereo field of view');}
for(const kind of ['hero','stereo','lidar'])for(const width of [1120,348,280]){
 const height=kind==='hero'?370:450,canvas=createCanvas(width,height);const ctx=canvas.getContext('2d');ctx.fillStyle='#0e151e';ctx.fillRect(0,0,width,height);
 const s={ctx,w:width,h:height,t:.25,preview:false,layers:{points:true,geometry:true,rays:true,tracks:true}};
 qa['draw'+kind[0].toUpperCase()+kind.slice(1)](s);
 fs.writeFileSync(path.join(out,`${kind}-${width}.png`),canvas.toBuffer('image/png'));
 if(kind!=='hero'){const a=canvas.toBuffer('image/png');s.layers={points:false,geometry:false,rays:false,tracks:false};ctx.clearRect(0,0,width,height);qa['draw'+kind[0].toUpperCase()+kind.slice(1)](s);assert(!a.equals(canvas.toBuffer('image/png')),'Layer switch has no visual effect');}
}
const button={setAttribute(k,v){this[k]=v}},s={button};qa.setPlaying(s,false);assert(!s.playing&&button.textContent==='Play','Pause state');qa.setPlaying(s,true);assert(s.playing&&button.textContent==='Pause','Play state');
const start=qa.motionData(0),end=qa.motionData(1);
assert(JSON.stringify(start.holds)===JSON.stringify(end.holds),'Wall holds moved');
assert(end.window.y>start.window.y,'Window did not scan upward');
assert(JSON.stringify(start.visible.map(p=>p.id))!==JSON.stringify(end.visible.map(p=>p.id)),'Visible hold subset did not change');
for(const t of [0,.13,.42,.78,1]){
 const data=qa.motionData(t);
 for(const p of data.visible){const [x,y]=data.local([p.x,p.y]);assert(x>=0&&x<=1&&y>=0&&y<=1,'Local point outside frame');assert(Math.abs(x*data.window.w+data.window.x-p.x)<1e-9&&Math.abs(y*data.window.h+data.window.y-p.y)<1e-9,'Frame-to-template mapping inconsistent');}
 const eps=1e-6,a=qa.climberAt(t-eps),b=qa.climberAt(t+eps);assert(Math.abs(Math.hypot(b[0]-a[0],b[1]-a[1])/(2*eps*12)-qa.speedAt(t))<1e-7,'Speed not derived from same trajectory');
}
for(const width of [540,348,280]){
 for(const [kind,draw] of [['stereo',qa.drawStereoCover],['lidar',qa.drawLidar],['collision',qa.drawCollision],['motion',qa.drawMotionCover]]){
  const canvas=createCanvas(width,225),ctx=canvas.getContext('2d');ctx.fillStyle='#0e151e';ctx.fillRect(0,0,width,225);draw({ctx,w:width,h:225,t:.25,panel:0,preview:true,layers:{points:true,geometry:true,rays:true,tracks:true}});fs.writeFileSync(path.join(out,`${kind}-cover-${width}.png`),canvas.toBuffer('image/png'));
 }
 for(const kind of ['collision','motion'])for(let panel=0;panel<3;panel++){
  const canvas=createCanvas(width,325),ctx=canvas.getContext('2d');ctx.fillStyle='#0e151e';ctx.fillRect(0,0,width,325);qa[kind==='motion'?'drawMotion':'drawCollision']({ctx,w:width,h:325,t:.42,panel});fs.writeFileSync(path.join(out,`${kind}-panel${panel}-${width}.png`),canvas.toBuffer('image/png'));
 }
}
console.log('PASS: sensor geometry, occlusion, layer states; fixed wall holds, upward window, changing visible subsets, invertible frame mapping and speed derived from one trajectory; four covers and six phase panels rendered at 540/348/280px. Browser layout checks remain pending.');

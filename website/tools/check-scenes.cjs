// Canvas-only checks for environments without a browser binary.
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'qa');fs.mkdirSync(out,{recursive:true});
const calls=[];
const mockDocument={querySelectorAll:()=>[],hidden:false};
const context={document:mockDocument,window:{matchMedia:()=>({matches:false,addEventListener(){}}),devicePixelRatio:1},ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},requestAnimationFrame(){}};
vm.createContext(context);
const src=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').replace(/\}\)\(\);\s*$/, 'globalThis.qa={stereoData,lidarData,rayHit,drawStereo,drawLidar,drawHero,setPlaying,render};})();');
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
console.log('PASS: stereo FOV/range, first-surface occlusion, free-space returns, target visibility, layer render changes, play/pause state; canvas renders at 1120/348/280px. Browser layout checks remain pending.');

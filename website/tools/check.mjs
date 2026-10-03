// Local rendering and interaction checks. Requires Playwright in the QA environment.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
const require=createRequire(import.meta.url);
const { chromium }=require('playwright');
const root=resolve(process.argv[2]||'.');
const output=resolve(process.argv[3]||'qa');mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
for(const path of ['index.html','projects/stereo.html','projects/lidar.html','projects/collision.html','projects/motion.html','404.html']){
  await page.goto(pathToFileURL(resolve(root,path)).href);await page.waitForTimeout(150);
  const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(horizontal)throw new Error('Desktop overflow: '+path);
  if(await page.locator('h1').count()!==1)throw new Error('Missing unique page heading: '+path);
  if(path==='index.html')await page.screenshot({path:resolve(output,'desktop-home.png'),fullPage:true});
  if(path==='projects/stereo.html'){
    await page.locator('[data-play]').click();
    const before=await page.locator('[data-time]').inputValue();await page.waitForTimeout(160);
    if(await page.locator('[data-time]').inputValue()!==before)throw new Error('Pause failed');
    await page.locator('[data-time]').fill('620');
    if(await page.locator('[data-time-label]').innerText()!=='7.4 s')throw new Error('Scrub failed');
    await page.locator('[data-layer="geometry"]').uncheck();
    await page.locator('[data-layer="geometry"]').check();
    await page.screenshot({path:resolve(output,'desktop-stereo.png'),fullPage:true});
    await page.locator('[data-play]').click();await page.waitForTimeout(180);
    if(await page.locator('[data-time]').inputValue()==='620')throw new Error('Play failed');
  }
  if(path==='projects/lidar.html'){
    await page.locator('[data-time]').fill('500');
    for(const layer of ['points','rays','tracks']){await page.locator(`[data-layer="${layer}"]`).uncheck();await page.locator(`[data-layer="${layer}"]`).check();}
    await page.screenshot({path:resolve(output,'desktop-lidar.png'),fullPage:true});
  }
  if(path==='projects/collision.html'||path==='projects/motion.html'){
    await page.locator('.media-toggle').click();
    if(!(await page.locator('.wide-image').getAttribute('src')).endsWith('.gif'))throw new Error('Media play failed');
    await page.locator('.media-toggle').click();
    if(!(await page.locator('.wide-image').getAttribute('src')).endsWith('.png'))throw new Error('Media still failed');
  }
}
for(const width of [390,320,768]){
  await page.setViewportSize({width,height:844});
  for(const path of ['index.html','projects/stereo.html','projects/lidar.html','projects/collision.html','projects/motion.html']){
    await page.goto(pathToFileURL(resolve(root,path)).href);await page.waitForTimeout(80);
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error(`${width}px overflow: ${path}`);
    if(width===390&&(path==='index.html'||path==='projects/stereo.html'))await page.screenshot({path:resolve(output,'mobile-'+(path==='index.html'?'home':'stereo')+'.png'),fullPage:true});
  }
}
await page.emulateMedia({reducedMotion:'reduce'});
await page.goto(pathToFileURL(resolve(root,'projects/stereo.html')).href);
if(await page.locator('[data-play]').innerText()!=='Play')throw new Error('Reduced motion ignored');
await page.setViewportSize({width:1440,height:1000});
await page.evaluate(()=>document.documentElement.style.fontSize='32px');
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('200% text overflow');
if(errors.length)throw new Error(errors.join('\n'));
console.log('PASS: six routes; 1440/768/390/320px layouts; play/pause, scrub, all layers, media playback, reduced motion, 200% text. No JS errors.');
await browser.close();

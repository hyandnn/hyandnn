// Optional full browser QA. Requires a browser binary and Playwright in the QA environment.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
const require=createRequire(import.meta.url);
const { chromium }=require('playwright');
const root=resolve(process.argv[2]||'.');
const output=resolve(process.argv[3]||'qa');mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=path=>pathToFileURL(resolve(root,path)).href;
const paths=['index.html','projects/stereo.html','projects/lidar.html','projects/collision.html','projects/motion.html','404.html'];
for(const lang of ['en','zh'])for(const path of paths){
 const route=(lang==='zh'?'zh/':'')+path;
 await page.goto(url(route));await page.waitForTimeout(100);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Overflow: '+route);
 if(await page.locator('h1').count()!==1)throw new Error('Page heading: '+route);
 if(await page.locator('html').getAttribute('lang')!==(lang==='zh'?'zh-CN':'en'))throw new Error('Language metadata: '+route);
 if(path.startsWith('projects/')){
  const range=page.locator('[data-time]');await range.fill('420');
  const paused=await range.inputValue();await page.waitForTimeout(150);if(await range.inputValue()!==paused)throw new Error('Pause');
  await page.locator('[data-play]').click();await page.waitForTimeout(180);if(await range.inputValue()===paused)throw new Error('Play');await page.locator('[data-play]').click();
  await range.fill('1000');await page.locator('[data-play]').click();await page.waitForTimeout(100);if(Number(await range.inputValue())>=1000)throw new Error('Replay from end');await page.locator('[data-play]').click();
  for(const input of await page.locator('[data-layer]').all()){await input.uncheck();await input.check();}
 }
 if(path==='index.html'||path==='projects/motion.html')await page.screenshot({path:resolve(output,lang+'-'+(path==='index.html'?'home':'motion')+'-desktop.png'),fullPage:true});
}
for(const width of [768,390,320])for(const lang of ['en','zh'])for(const path of paths.slice(0,-1)){
 await page.setViewportSize({width,height:844});await page.goto(url((lang==='zh'?'zh/':'')+path));await page.waitForTimeout(80);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error(`${width}px overflow: ${lang}/${path}`);
 if(width<=390&&(path==='projects/collision.html'||path==='projects/motion.html')){
  const columns=await page.locator('.phase-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);if(columns!==1)throw new Error('Phase panels not stacked');
 }
 if(width===390&&(path==='index.html'||path==='projects/motion.html'))await page.screenshot({path:resolve(output,lang+'-'+(path==='index.html'?'home':'motion')+'-mobile.png'),fullPage:true});
}
await page.goto(url('projects/motion.html'));await page.locator('[data-set-language="zh"]').click();await page.waitForURL(/zh\/projects\/motion.html/);await page.locator('[data-set-language="en"]').click();await page.waitForURL(/\/projects\/motion.html/);
await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url('projects/motion.html'));if(await page.locator('[data-play]').innerText()!=='Play')throw new Error('Reduced motion');
await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='32px');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('200% text overflow');
if(errors.length)throw new Error(errors.join('\n'));
console.log('PASS: twelve routes; language switching; desktop/mobile; shared playback, scrub, layers, replay, stacked phases, reduced motion and 200% text.');
await browser.close();

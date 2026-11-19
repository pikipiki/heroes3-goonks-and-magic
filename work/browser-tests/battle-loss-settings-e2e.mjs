// Exercise the native mobile command bridge, with a deterministic framebuffer.
import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
const baseline=process.env.BATTLE_COMPARE_REF||'ce9c515e',out=process.env.BATTLE_CAPTURE_DIR||'/tmp/goonk-battle-loss-settings';
fs.mkdirSync(out,{recursive:true});
const dimensions=[[320,568],[568,320]];
const ally={id:98,stackId:1,name:'Gnoll',count:12,attack:4,defense:6,currentHealth:5,maximumHealth:6,health:6,speed:5,x:102,y:196,enemy:false};
const enemy={...ally,id:99,stackId:2,name:'Enemy',count:7,x:718,y:196,enemy:true,canShootAt:true,canMeleeAt:true};
const state={mode:'battle',canAct:true,round:1,activeStack:1,activeUnit:ally,canAutoCombat:true,canRetreat:true,heroHasSpellbook:true,heroCanCast:true,battleCells:Array.from({length:165},(_,i)=>{const row=Math.floor(i/15),col=i%15+1;return{hex:row*17+col,x:36+(row%2===0?22:0)+44*col,y:112+42*row,kind:0,reachable:true,actionLabel:'Move'};}),battleUnits:[ally,enemy]};
const report=[];
const cached=new Map();
async function mount(browser,lang,viewport,reference){
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.addInitScript(lang=>{localStorage.setItem('heroes-goonk.language',lang);localStorage.setItem('heroes-goonk.default-battle-view','classic');},lang);
 await page.route('**/web/**',async route=>{
  const name=new URL(route.request().url()).pathname.slice(1),file=path.resolve(name);
  if(reference&&/\.(?:mjs|css)$/.test(name)){
   if(!cached.has(name)){try{cached.set(name,execFileSync('git',['show',reference+':'+name],{stdio:['ignore','pipe','ignore']}));}catch{cached.set(name,null);}}
   const body=cached.get(name);if(body)return route.fulfill({body,contentType:name.endsWith('.css')?'text/css':'text/javascript'});
  }
  return fs.existsSync(file)?route.fulfill({path:file}):route.abort();
 });
 await page.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js'),contentType:'text/javascript'}));
 await page.route('**/battle?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/game-menu.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="800" height="600"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(['command',...a])},_vcmiMobilePointer(...a){calls.push(['pointer',...a])}};const ctx=document.querySelector('canvas').getContext('2d');ctx.fillStyle='#777744';ctx.fillRect(0,0,800,600);ctx.fillStyle='rgb(200,20,20)';ctx.fillRect(0,0,800,30);ctx.fillStyle='rgb(20,20,200)';ctx.fillRect(0,525,800,30);</script><script type="module" src="/web/mobile.mjs"></script><script type="module" src="/web/game-menu.mjs"></script>`}));
 await silenceTestAudio(page);await page.goto('http://goonk.test/battle?mobile=1');await page.waitForSelector('#mobile-app');
 await page.waitForSelector('#game-menu-toggle');
 await send(page,state);await page.waitForTimeout(160);
 return{page,context,errors};
}
async function send(page,patch){await page.evaluate(detail=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...window.goonkMobileState,...detail}})),patch);await page.waitForTimeout(80);}
const box=(page,selector)=>page.locator(selector).boundingBox();


const lossState={...state,day:1,turn:true,battleLossEstimatesVersion:1,battleUnits:[ally,{...enemy,count:8,canShootAt:true,attackLosses:{actor:1,min:2,max:4}},{...enemy,id:100,stackId:3,count:15,x:674,y:238,canShootAt:true,attackLosses:{actor:1,min:1,max:3}},{...ally,id:101,stackId:4,x:630,y:280,attackLosses:{actor:1,min:7,max:9}}]};
const output=[];
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='chromium'?chromium:webkit).launch({headless:true});
 try{for(const lang of ['fr','en'])for(const [width,height]of dimensions){
  const {page,context,errors}=await mount(browser,lang,{width,height});
  const setState=()=>send(page,lossState);
  const preferences=()=>page.evaluate(async()=>{const p=await import('/web/battle-preferences.mjs'),l=await import('/web/ui/battle-losses.mjs');return {enabled:p.battleLossEstimates(),stored:localStorage.getItem('heroes-goonk.battle-loss-estimates'),labels:l.enemyLossEstimates(goonkMobileState).map(e=>e.label)};});
  const settings=async()=>{await page.locator('#game-menu-toggle').tap();await page.locator('[data-menu=settings]').tap();await page.locator('[data-battle-loss-estimates]').scrollIntoViewIfNeeded();};
  await setState();assert.deepEqual(await preferences(),{enabled:true,stored:null,labels:['−2–4','−1–3']},'Native casualty ranges on enemies only, enabled by default');
  const geometry=await page.locator('.mobile-play').boundingBox();
  await settings();const input=page.locator('[data-battle-loss-estimates]');assert(await input.isChecked(),'Default checked');assert(await input.evaluate(e=>!!e.closest('.MuiCheckbox-root')),'True MUI Checkbox');
  const text=await page.locator('[data-loss-label]').textContent();assert.equal(text,lang==='fr'?'Estimation des pertes ennemies':'Enemy casualty estimates');
  await input.uncheck();assert.deepEqual(await preferences(),{enabled:false,stored:'false',labels:[]},'Checkbox changes preference and label producer immediately');
  await page.locator('[data-menu=close]').tap();await page.waitForFunction(()=>!/Pertes ennemies estimées|Estimated enemy casualties/.test(document.querySelector('#mobile-scene').getAttribute('aria-label'))); assert.deepEqual(await page.locator('.mobile-play').boundingBox(),geometry,'Preference toggle does not move the battlefield');
  assert.equal(await page.locator('.mobile-nav>[data-ui=defend]:visible').count(),1,'Defend is a direct action');assert.equal(await page.locator('.mobile-nav>[data-ui=battle-magic]:visible').count(),0,'Magic is secondary');
  await page.evaluate(()=>calls.length=0);await page.locator('.mobile-nav>[data-ui=defend]').tap();assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='command'&&c[1]===13).length),1,'Defend sends exactly one native command');
  await page.locator('.mobile-nav>button[aria-haspopup=menu]').tap();await page.locator('.MuiMenu-root [data-ui=battle-magic]').waitFor({state:'visible'});await page.evaluate(()=>calls.length=0);await page.locator('.MuiMenu-root [data-ui=battle-magic]').tap();assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='command'&&c[1]===14).length),1,'Magic in Plus sends exactly one native command');
  await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-actions.png`)});
  await page.reload();await page.waitForSelector('#game-menu-toggle');await setState();assert.deepEqual(await preferences(),{enabled:false,stored:'false',labels:[]},'Disabled survives actual page reload');
  await settings();assert(!await input.isChecked(),'Settings acknowledges persisted false');await input.check();assert.deepEqual(await preferences(),{enabled:true,stored:'true',labels:['−2–4','−1–3']},'Re-enable restores estimates immediately');await page.waitForFunction(()=>/Pertes ennemies estimées|Estimated enemy casualties/.test(document.querySelector('#mobile-scene').getAttribute('aria-label')));await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-settings.png`)});
  await page.reload();await page.waitForSelector('#game-menu-toggle');await setState();assert.deepEqual(await preferences(),{enabled:true,stored:'true',labels:['−2–4','−1–3']},'Enabled survives actual page reload');
  await page.evaluate(()=>{window.deniedStorage={getItem(){throw Error('private')},setItem(){throw Error('private')}}});
  assert.deepEqual(await page.evaluate(async()=>{const p=await import('/web/battle-preferences.mjs');p.setBattleLossEstimates(false,deniedStorage);const off=p.battleLossEstimates(deniedStorage);p.setBattleLossEstimates(true,deniedStorage);return[off,p.battleLossEstimates(deniedStorage)];}),[false,true],'Private storage failure retains session preference');
  assert.deepEqual(errors,[]);output.push({kind,lang,width,height});await context.close();console.log('PASS',kind,lang,width,height,'MUI preference default, immediate effect, persistence and native Defend/Magic commands');
 }}finally{await browser.close();}
}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(output,null,2));

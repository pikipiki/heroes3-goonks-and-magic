// Exercise the native mobile command bridge, with a deterministic framebuffer.
import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
const baseline=process.env.BATTLE_COMPARE_REF||'6514aa10',out=process.env.BATTLE_CAPTURE_DIR||'/tmp/goonk-compact-battle';
fs.mkdirSync(out,{recursive:true});
const dimensions=[[320,568],[360,659],[430,932],[716,279],[568,320]];
const ally={id:98,stackId:1,name:'Gnoll',count:12,attack:4,defense:6,currentHealth:5,maximumHealth:6,health:6,speed:5,x:102,y:196,enemy:false};
const enemy={...ally,id:99,stackId:2,name:'Enemy',count:7,x:718,y:196,enemy:true,canShootAt:true,canMeleeAt:true};
const state={mode:'battle',canAct:true,round:1,activeStack:1,activeUnit:ally,canAutoCombat:true,canRetreat:true,heroHasSpellbook:true,heroCanCast:true,battleCells:Array.from({length:165},(_,i)=>{const row=Math.floor(i/15),col=i%15+1;return{hex:row*17+col,x:36+(row%2===0?22:0)+44*col,y:112+42*row,kind:0,reachable:true,actionLabel:'Move'};}),battleUnits:[ally,enemy]};
const report=[];
const cached=new Map();
async function mount(browser,lang,viewport,reference){
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(lang=>{localStorage.setItem('heroes-goonk.language',lang);localStorage.setItem('heroes-goonk.default-battle-view','classic');},lang);
 await page.route('**/web/**',async route=>{
  const name=new URL(route.request().url()).pathname.slice(1),file=path.resolve(name);
  if(reference&&/\.(?:mjs|css)$/.test(name)){
   if(!cached.has(name)){try{cached.set(name,execFileSync('git',['show',reference+':'+name],{stdio:['ignore','pipe','ignore']}));}catch{cached.set(name,null);}}
   const body=cached.get(name);if(body)return route.fulfill({body,contentType:name.endsWith('.css')?'text/css':'text/javascript'});
  }
  return fs.existsSync(file)?route.fulfill({path:file}):route.abort();
 });
 await page.route('**/battle?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="800" height="600"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(['command',...a])},_vcmiMobilePointer(...a){calls.push(['pointer',...a])}};const ctx=document.querySelector('canvas').getContext('2d');ctx.fillStyle='#777744';ctx.fillRect(0,0,800,600);ctx.fillStyle='rgb(200,20,20)';ctx.fillRect(0,0,800,30);ctx.fillStyle='rgb(20,20,200)';ctx.fillRect(0,525,800,30);</script><script type="module" src="/web/mobile.mjs"></script>`}));
 await silenceTestAudio(page);await page.goto('http://goonk.test/battle?mobile=1');await page.waitForSelector('#mobile-app');
 await page.evaluate(async()=>{const {createUIElement}=await import('/web/ui/material-components.mjs'),button=createUIElement('button');button.id='game-menu-toggle';button.textContent='☰';button.setAttribute('aria-label','Menu');document.querySelector('.mobile-brand').replaceWith(button);});
 await send(page,state);await page.waitForTimeout(160);
 return{page,context,errors};
}
async function send(page,patch){await page.evaluate(detail=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...window.goonkMobileState,...detail}})),patch);await page.waitForTimeout(80);}
const box=(page,selector)=>page.locator(selector).boundingBox();
async function openMore(page,toolbar=false){const trigger=page.locator(toolbar?'.battle-team-actions>button[aria-haspopup=menu]':'.mobile-nav>button[aria-haspopup=menu]');await trigger.tap();await page.locator('.MuiModal-root[data-ui-menu-open=true]').waitFor({state:'visible'});assert.equal(await trigger.getAttribute('aria-expanded'),'true');return trigger;}
async function command(page,selector,code){await page.evaluate(()=>calls.length=0);await page.locator(selector).tap();assert.equal(await page.evaluate(code=>calls.filter(a=>a[0]==='command'&&a[1]===code).length,code),1,selector+' fires once');}
for(const kind of (process.env.BATTLE_BROWSERS||'chromium,webkit').split(',')){
 const browser=await(kind==='chromium'?chromium:webkit).launch({headless:true});
 try{for(const lang of (process.env.BATTLE_LANGUAGES||'fr,en').split(','))for(const [width,height]of (process.env.BATTLE_SMOKE?dimensions.slice(0,1):dimensions)){
  const viewport={width,height},before=await mount(browser,lang,viewport,baseline),oldScene=await box(before.page,'.mobile-play');
  await before.page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-before.png`)});await before.context.close();
  const{page,context,errors}=await mount(browser,lang,viewport),scene=await box(page,'.mobile-play'),header=await box(page,'.mobile-top'),nav=await box(page,'.mobile-nav');
  assert.equal(header.height,56);assert.equal(nav.height,56);
  assert.equal(await page.locator('.mobile-nav>button:visible').count(),3);
  assert.equal(await page.locator('.battle-team-actions>button:visible').count(),2);
  assert(await page.locator('[data-ui=battle-auto]').evaluate(e=>e.classList.contains('MuiIconButton-root')),'Auto uses MUI IconButton');
  for(const selector of ['#game-menu-toggle','.battle-view','.battle-team-actions>button:visible','.mobile-nav>button:visible','.battle-unit-inspect'])for(const button of await page.locator(selector).all()){
   const r=await button.boundingBox();assert(r.width>=47.9&&r.height>=47.9,selector+' touch target '+JSON.stringify(r));assert(r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1,selector+' in viewport '+JSON.stringify(r));
   if(!await button.isDisabled())assert(await button.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),selector+' owns its touch target '+await button.evaluate(e=>{const r=e.getBoundingClientRect();return JSON.stringify({text:e.textContent,rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,1000)})}));
  }
  if(width<height){assert(scene.height>=oldScene.height+50,'Portrait gains battlefield height '+JSON.stringify({oldScene,scene}));assert.equal(scene.y,56);}else{assert.equal(scene.y,0);assert(scene.height>=height-1);}
  assert((await page.locator('.battle-unit-sub').innerText()).includes('12'));
  await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-after.png`)});
  if(width===320){
   const tapCell=async()=>{const point=await page.evaluate(async()=>{const {fitNativeBattle}=await import('/web/battle-scene.mjs'),canvas=document.querySelector('#battle-strategic-scene'),r=canvas.getBoundingClientRect(),l=fitNativeBattle(r.width,r.height,null,'whole');return{x:r.x+l.dx+234*l.scale,y:r.y+l.dy+280*l.scale};});await page.touchscreen.tap(point.x,point.y);};
   await page.evaluate(()=>calls.length=0);await tapCell();assert.equal(await page.evaluate(()=>calls.filter(a=>a[0]==='command'&&a[1]===14).length),0,'First movement tap only previews');await tapCell();assert.equal(await page.evaluate(()=>calls.filter(a=>a[0]==='command'&&a[1]===14&&a[2]===4).length),1,'Second movement tap confirms once');await page.waitForTimeout(650);
   await send(page,{spellTargeting:true,selectedSpell:'Magic Arrow'});await command(page,'.mobile-nav>[data-ui=battle-magic]',14);assert.equal(await page.evaluate(()=>calls.find(a=>a[0]==='command'&&a[1]===14)[2]),2,'Magic cancels the selected spell');assert(await page.locator('.mobile-nav>[data-ui=battle-magic]').isDisabled());await send(page,{spellTargeting:false});
   await send(page,{spellTargeting:true,battleCells:state.battleCells.map(c=>({...c,spellTarget:true}))});await page.evaluate(()=>calls.length=0);await tapCell();assert.equal(await page.evaluate(()=>calls.filter(a=>a[0]==='command'&&a[1]===14&&a[2]===3).length),1,'Spell target casts once');await send(page,{spellTargeting:false,battleCells:state.battleCells});await page.waitForTimeout(650);
  }
  await openMore(page);assert(await page.locator('.MuiMenu-root [data-ui=wait]').isVisible());await command(page,'[data-ui=wait]',12);
  await send(page,{canWait:false});await openMore(page);assert(await page.locator('[data-ui=wait]').isDisabled());await page.keyboard.press('Escape');assert(await page.locator('.mobile-nav>button[aria-haspopup=menu]').evaluate(e=>e===document.activeElement));for(let i=0;i<3;i++)await send(page,{});assert.equal(await page.locator('.mobile-nav>button[aria-haspopup=menu]').count(),1,'Repeated native snapshots preserve the More trigger');
  await openMore(page);await command(page,'[data-ui=defend]',13);
  await openMore(page);await page.locator('[data-ui=targets]').tap();assert(await page.locator('.target-picker-head').isVisible());const targetList=await box(page,'.target-picker-list');assert(targetList.height>=71,'Targets retain their scrolling area '+JSON.stringify(targetList));await page.locator('.target-picker-list [data-battle-target]').first().tap();assert(!(await page.locator('.target-picker-head').count()));
  await openMore(page,true);await command(page,'[data-ui=battle-retreat]',38);
  await command(page,'[data-ui=battle-auto]',44);assert.equal(await page.locator('[data-ui=battle-auto]').getAttribute('aria-busy'),'true');assert(await page.locator('[data-ui=battle-auto]').isDisabled());
  await send(page,{autoCombat:true});assert.equal(await page.locator('[data-ui=battle-auto]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-ui=battle-auto]').getAttribute('aria-busy'),'false');await command(page,'[data-ui=battle-auto]',44);await send(page,{autoCombat:false});
  await command(page,'.mobile-nav>[data-ui=battle-magic]',14);await page.waitForTimeout(2050);
  await send(page,{tacticsMode:true,round:0,canEndTactics:true});assert.equal(await page.locator('.mobile-nav>button:visible').count(),3);await command(page,'.mobile-nav>[data-ui=end-tactics]',35);
  assert.deepEqual(errors,[]);report.push({kind,lang,width,height,before:oldScene,after:scene,gainedHeight:scene.height-oldScene.height});await context.close();
 }}finally{await browser.close();}
}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

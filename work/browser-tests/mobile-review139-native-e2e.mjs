import {execFileSync} from 'node:child_process';
import{chromium,webkit}from'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';
const browser=await (process.env.BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.BROWSER==='webkit'?{}:{args:['--no-sandbox']})}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>{errors.push(e.stack);console.log('PAGE ERROR',e.stack);});p.on('console',m=>{if(/Server encountered a problem|Assertion failed/.test(m.text()))errors.push(m.text());});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),command=(...args)=>p.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('Native engine ready');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkTown':
     o['subtype']='core:'+sys.argv[1];o['template']['animation']='AVCCAST0.DEF';o['options']['name']='Castellatus';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1','core:blacksmith']}
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:archangel','amount':1},{'type':'core:pikeman','amount':20}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=1
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,process.env.FACTION||'castle']);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await command(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await command(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await command(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('Native fixture ready');

 await command(5);await wait(()=>goonkMobileState.mode==='town');
 const check=async(label)=>{for(const v of [{width:390,height:740},{width:740,height:320},{width:1024,height:768}]){await p.setViewportSize(v);await p.waitForTimeout(180);const bad=await p.locator('button.back-button:visible').evaluateAll(bs=>bs.filter(b=>{const r=b.getBoundingClientRect();return r.bottom>innerHeight+1||r.right>innerWidth+1||r.width<70}).map(b=>({html:b.outerHTML,rect:b.getBoundingClientRect().toJSON()})));assert.deepEqual(bad,[],label);await p.screenshot({path:'/tmp/general137-'+label+'-'+v.width+'.png'});}};

 await check('town');console.log('town checked');
 await p.setViewportSize({width:390,height:740});await p.waitForTimeout(200);assert.equal(await p.locator('.town-zoom-control').isVisible(),false);
 await p.locator('[data-ui=town-blacksmith]').tap();await wait(()=>goonkMobileState.dialogKind==='blacksmith');await check('machine');console.log('machine checked');assert(await p.locator('.town-service').isVisible());assert(await p.locator('.town-service').evaluate(e=>e.getBoundingClientRect().height>150));
 await p.locator('.town-service footer [data-service-back]').tap();await wait(()=>goonkMobileState.mode==='town');
 await p.locator('[data-ui=town-fort]').tap();await wait(()=>goonkMobileState.mode==='fort');await check('hall');console.log('hall checked');
 for(const v of [{width:390,height:740},{width:740,height:320}]){await p.setViewportSize(v);await p.waitForTimeout(150);const b=await p.locator('[data-presentation-close]').boundingBox();assert(b.x+b.width<=v.width);}
 await p.locator('[data-recruit-all]').tap();await p.locator('[data-ui=confirm-recruit-all]').tap();await p.locator('[data-sheet=recruitment-summary]').waitFor();assert(await p.locator('.recruit-all-roster article').count()>0);await p.locator('.sheet-body [data-ui=close-sheet]').tap();
 await p.locator('[data-presentation-close]').tap();await wait(()=>goonkMobileState.mode==='town');await p.locator('.mobile-nav [data-ui=back]').tap();await wait(()=>goonkMobileState.mode==='map');
 console.log('opening commander');await command(55);await wait(()=>goonkMobileState.mode==='hero');await command(85);await wait(()=>goonkMobileState.dialogKind==='commander');await p.waitForTimeout(500);console.log('COMMANDER',await p.evaluate(()=>({unit:goonkMobileState.dialogPresentation?.unit?.name,previews:goonkMobileState.previewUnits?.length})));assert(await p.locator('.commander-preview').isVisible());await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='hero');await command(0);await wait(()=>goonkMobileState.mode==='map');
 await p.setViewportSize({width:390,height:740});
 for(const tab of ['settings','cheats','storage','new-game']){await p.locator('#game-menu-toggle').tap();await p.locator('#game-menu nav [data-menu='+tab+']').tap();assert.equal(await p.locator('#game-menu header [data-menu=back]').isVisible(),false);await p.locator('#game-menu [data-menu=back]:visible').tap();await p.locator('#game-menu [data-menu=close]').tap();}
 console.log('PASS native machine, recruitment summary, short landscape and menu taps');assert.deepEqual(errors,[]);
}catch(error){console.error(error);await p.screenshot({path:'/tmp/general139-failed.png'});throw error;}finally{await browser.close();}

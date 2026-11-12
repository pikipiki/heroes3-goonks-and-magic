import {execFileSync} from 'node:child_process';
import{chromium}from'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>{errors.push(e.stack);console.log('PAGE ERROR',e.stack);});p.on('console',m=>{if(/Server encountered a problem|Assertion failed/.test(m.text()))errors.push(m.text());});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),command=(...args)=>p.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('Native engine ready');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkTown':
     o['subtype']='core:castle';o['template']['animation']='AVCCAST0.DEF';o['options']['name']='Castellatus';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1','core:blacksmith']}
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow'],'artifacts':{'spellbook':'core:spellBook'},'army':[u for u in json.loads(sys.argv[1]) if u['type'] not in ['core:catapult','core:ballista','core:firstAidTent','core:ammoCart','core:arrowTower']]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=50
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,process.env.ROSTER||JSON.stringify(['paingpaingExalted','picpiqueExalted','zinzeclairExalted','bubuExalted','glouglouExalted','bobopeExalted','maillemailleExalted'].map(type=>({type:'goonk:'+type,amount:5})))]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await command(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await command(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await command(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('Native fixture ready');await command(29,3);await command(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');await command(15);await p.waitForTimeout(300);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await command(35);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.round>0&&goonkMobileState.canAct);console.log('Native battle ready');


 await p.setViewportSize({width:390,height:740});await p.waitForTimeout(250);assert.equal(await p.locator('#mobile-app').getAttribute('data-vertical-battle'),'false');await p.locator('.battle-view').click();await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattleSpriteBounds?.length>2);
 const caseName=process.env.CASE_NAME||'goonk',units=await p.evaluate(()=>goonkMobileState.battleUnits);
 const samples=await p.evaluate(async()=>{const rows=[];for(let n=0;n<40;n++){const atlas=goonkBattleAtlas,ctx=atlas.getContext('2d');rows.push(goonkBattleSpriteBounds.map(b=>{const i=goonkBattleAtlasIds.get(b.stackId),d=ctx.getImageData(i%8*128+8,Math.floor(i/8)*128+8,112,112).data;let opaque=0;for(let p=3;p<d.length;p+=4)if(d[p]>32)opaque++;return {...b,opaque};}));await new Promise(r=>setTimeout(r,50));}return rows;});fs.writeFileSync('/tmp/vertical-complex-samples.json',JSON.stringify(samples));const blanks=samples.flat().filter(r=>r.w===0||r.opaque===0);console.log('SAMPLES',samples.length,'BLANKS',blanks.length,'BOUNDS',samples[0]);
 for(const v of [{width:320,height:568},{width:390,height:740},{width:768,height:1024}]){await p.setViewportSize(v);await p.waitForTimeout(250);await p.screenshot({path:'/tmp/vertical-complex-'+caseName+'-'+v.width+'.png'});assert(await p.locator('.mobile-nav').evaluate(c=>c.getBoundingClientRect().bottom<=innerHeight+1));}
 fs.mkdirSync('outputs/combat-review/cases',{recursive:true});fs.writeFileSync('outputs/combat-review/cases/'+caseName+'.json',JSON.stringify({caseName,requested:JSON.parse(process.env.ROSTER||'[]'),units,samples:samples.length,blankSprites:blanks.length},null,2)+'\n');
 assert.equal(blanks.length,0,'Living native sprites never blink out during idle');console.log('PASS complex native army and commander');assert.deepEqual(errors,[]);
}catch(error){console.error(error);await p.screenshot({path:'/tmp/vertical-complex-failed.png'});throw error;}finally{await browser.close();}

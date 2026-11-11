import {chromium,webkit} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const kind=process.env.BROWSER||'chromium',out=process.env.REVIEW_OUTPUT||'/tmp/review132-native';fs.mkdirSync(out,{recursive:true});
const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
try{
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});p.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text().slice(0,200))});
 // A cold private load must recover from one failed engine package request.
 let dataRequests=0;await p.route(/\/vcmiclient\.[a-f0-9]+\.data$/,r=>++dataRequests===1?r.abort('connectionreset'):r.continue());
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 await p.waitForFunction(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,{timeout:180000});assert(dataRequests>=2,'Retry the failed engine package');console.log('PASS engine package retry in temporary mode');
 const cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),wait=(f,a)=>p.waitForFunction(f,a,{timeout:45000});
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=json.loads(data)
   objects=[o for o in objects if o.get('instanceName') not in ['trainingGuard','trainingOgre']]
   for o in objects:
    if o.get('instanceName')=='goonkHero':o['options'].update({'type':'core:christian','secondarySkills':{'core:wisdom':'basic'}})
   objects.append({'type':'core:treasureChest','subtype':'core:treasureChest','instanceName':'reviewChest','x':10,'y':11,'l':0,'template':{'animation':'AVTchest.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}})
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS new game');
 await cmd(5);await wait(()=>goonkMobileState.mode==='town');await p.waitForTimeout(200);await p.screenshot({path:path.join(out,kind+'-town.png')});
 await p.locator('[data-ui=recruit-heroes]').tap();await wait(()=>goonkMobileState.dialogKind==='tavern');await p.screenshot({path:path.join(out,kind+'-tavern.png')});await p.locator('[data-tavern-close]').tap();await wait(()=>goonkMobileState.mode==='town');await cmd(0);await wait(()=>goonkMobileState.mode==='map');console.log('PASS native tavern');
 await cmd(29,5);await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up');
 const level=await p.evaluate(()=>goonkMobileState.dialogPresentation);fs.writeFileSync(path.join(out,kind+'-level.json'),JSON.stringify(level,null,2));assert(level.choices.length>0);assert(level.lines.some(line=>line.includes('level')));
 await p.locator('[data-dialog-choice]').last().tap();await wait(()=>goonkMobileState.dialogPresentation.choices.at(-1).selected);await p.screenshot({path:path.join(out,kind+'-level.png')});await p.locator('[data-dialog-confirm]').tap();await p.waitForTimeout(400);
 if(await p.evaluate(()=>goonkMobileState.dialogKind==='commander-level-up')){
  const commander=await p.evaluate(()=>goonkMobileState.dialogPresentation);assert(commander?.choices.length>0,'Commander exposes available skills');fs.writeFileSync(path.join(out,kind+'-commander.json'),JSON.stringify(commander,null,2));await p.locator('[data-dialog-choice]').last().tap();await wait(()=>goonkMobileState.dialogPresentation.choices.at(-1).selected);await p.screenshot({path:path.join(out,kind+'-commander.png')});await p.locator('[data-dialog-confirm]').tap();console.log('PASS native commander skill selection');
 }
 await wait(()=>goonkMobileState.mode==='map');console.log('PASS native hero level choice and confirm');
 await cmd(6);await p.waitForTimeout(250);
 const target=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:Math.round(v.x+v.w/2+64),y:Math.round(v.y+v.h/2)}});
 await p.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),target);await wait(()=>goonkMobileState.hasPath);await p.locator('[data-ui=move]').tap();await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.choices?.length===2);
 const reward=await p.evaluate(()=>goonkMobileState.dialogPresentation);fs.writeFileSync(path.join(out,kind+'-reward.json'),JSON.stringify(reward,null,2));assert(reward.choices.every(c=>c.selectable));
 const gold=await p.evaluate(()=>goonkMobileState.resources[6]);await p.locator('[data-dialog-choice="0"]').tap();await wait(()=>goonkMobileState.dialogPresentation.choices[0].selected);await p.screenshot({path:path.join(out,kind+'-reward.png')});await p.locator('[data-dialog-confirm]').tap();await wait(gold=>goonkMobileState.mode==='map'&&goonkMobileState.resources[6]>gold,gold);console.log('PASS native reward updates treasury once');
 assert.deepEqual(errors,[]);console.log('PASS',kind,'real engine dialog integration');
 const failed=await browser.newPage({viewport:{width:390,height:740},hasTouch:true,bypassCSP:true});let failures=0;
 await failed.route(/\/vcmiclient\.[a-f0-9]+\.data$/,r=>{failures++;return r.abort('connectionreset')});
 await failed.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await failed.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 await failed.locator('#status button').waitFor({timeout:30000});assert.equal(failures,2);assert.match(await failed.locator('#status').innerText(),/retry/i);await failed.close();console.log('PASS permanent package failure offers retry');
}catch(error){console.error(error);process.exitCode=1;}finally{await browser.close();}

import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const project=Number(process.env.PROJECT||0);const out=process.env.REVIEW_OUTPUT||'/tmp/commander-preview-151';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});let p;const messages=[],errors=[];
try{
 p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{messages.push(m.type()+': '+m.text());fs.appendFileSync(path.join(out,'live-console.log'),m.type()+': '+m.text()+'\n');if(m.type()==='error')console.log(m.text().slice(0,180));});
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8781')+(process.env.GAME_PATH||'/game.html')+'?mobile=1');
 const wait=(fn,arg,timeout=60000)=>p.waitForFunction(fn,arg,{timeout}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);console.log('PASS native engine load');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util,os
spec=importlib.util.spec_from_file_location('adv','scripts/place-adventure-objects.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name in ['english.json','french.json']:
   t=json.loads(data);t['mapName']='000 - Goonk adventures test';data=json.dumps(t).encode()
  if name=='header.json':
   h=json.loads(data);h['name']='000 - Goonk adventures test';data=json.dumps(h).encode()
  if name=='objects.json':
   o=json.loads(data);o=[a for a in o if not a['instanceName'].startswith('goonkAdventure') and a['instanceName'] not in ['trainingGuard','trainingOgre']]
   for a in o:
    if a['instanceName']=='goonkHero':a['options'].update({'type':'core:christian','secondarySkills':{'core:wisdom':'basic'},'artifacts':{'mach1':'core:ballista','mach2':'core:ammoCart','mach3':'core:firstAidTent'}})
   if os.environ.get('PROJECT')=='1':
    for a in o:
     if a['instanceName']=='goonkHero':a['options']['army']=[{'type':'core:ancientBehemoth','amount':2}]
   o += [m.adventure_object('adventureCache',10,11,'testCache'),m.adventure_object('adventureWorkshop',13,11,'testWorkshop'),m.adventure_object('adventureWorkshop',13,14,'secondWorkshop'),m.adventure_object('adventureAcademy',17,16,'testAcademy')]
   o.append({'type':'core:monster','subtype':'core:masterGremlin' if os.environ.get('PROJECT')=='1' else 'core:pikeman','instanceName':'battleGuard','x':17,'y':11,'l':0,'template':{'animation':'AVWgreX0.def' if os.environ.get('PROJECT')=='1' else 'AVWpikX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':100 if os.environ.get('PROJECT')=='1' else 30,'character':'savage','neverFlees':True}})
   data=json.dumps(o).encode()
  dst.writestr(name,data)
spec=importlib.util.spec_from_file_location('normalizer','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
with zipfile.ZipFile(io.BytesIO(out.getvalue())) as z:entries={name:z.read(name) for name in z.namelist()}
entries=n.normalize(entries);normalized=io.BytesIO()
with zipfile.ZipFile(normalized,'w',zipfile.ZIP_DEFLATED) as dst:
 for name,data in entries.items():dst.writestr(name,data)
sys.stdout.buffer.write(normalized.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Goonk adventures test');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS new fixture game');
 await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero');await cmd(85);await wait(()=>goonkMobileState.dialogPresentation?.commanderTree?.abilities?.length===15);

 await p.setViewportSize({width:390,height:844});await wait(()=>window.goonkCreaturePreviewVersion>1);
 await p.evaluate(()=>{window.previewSaved=goonkCreaturePreviewAtlas;window.previewBytes=previewSaved.getContext('2d').getImageData(0,0,previewSaved.width,previewSaved.height).data;});
 for(let i=0;i<20;i++){await p.waitForTimeout(100);assert(await p.evaluate(()=>{const d=previewSaved.getContext('2d').getImageData(0,0,previewSaved.width,previewSaved.height).data;return d.every((v,i)=>v===previewBytes[i]);}),'Previously rendered commander colors remain immutable');}
 await p.screenshot({path:path.join(out,'commander-detail.png')});await p.locator('[data-commander-tree]').tap();
 const skills=(await state()).dialogPresentation.commanderTree.skills;
 for(const skill of skills){const meter=p.locator('[data-tree-skill="'+skill.id+'"] .tree-ranks');assert.equal(await meter.getAttribute('aria-valuenow'),String(skill.rank));assert.equal(await meter.locator('[data-filled=true]').count(),skill.rank);assert.equal(await meter.locator('[data-master]').count(),0);}
 await p.screenshot({path:path.join(out,'commander-zero-ranks.png')});assert.deepEqual(errors,[]);console.log('PASS native commander preview immutable for 20 frames and every rank meter matches acquired ranks');
}catch(e){throw e;}finally{await browser.close();}

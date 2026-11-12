import {chromium,webkit} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const kind=process.env.BROWSER||'chromium',out=process.env.REVIEW_OUTPUT||'/tmp/battle-colors-150';fs.mkdirSync(out,{recursive:true});
const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,deviceScaleFactor:3,isMobile:true,bypassCSP:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
let phase='boot';p.on('console',m=>{if(m.type()==='error'||/Map.+error|Error loading/i.test(m.text()))console.log('ENGINE',m.text().slice(0,300));});
const wait=f=>p.waitForFunction(f,null,{timeout:90000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu');
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
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:lightningBolt'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:'+name,'amount':20} for name in ['pikeman','archer','archangel','fireElemental','azureDragon','airElemental','blackKnight']]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=50
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 phase='lobby';await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);console.log('PASS lobby ready');phase='select';await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));console.log('PASS map selected');phase='begin';await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS native fixture starts');
 phase='battle';await cmd(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(200);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await cmd(35);
 await p.setViewportSize({width:390,height:740});
 assert.equal(await p.locator('#mobile-app').getAttribute('data-vertical-battle'),'false');await p.locator('.battle-view').tap();
 await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattlePlanes?.version>2&&window.goonkBattleSpriteBounds?.length>2);
 await wait(()=>goonkMobileState.canAct&&!goonkMobileState.animating);
 const report={browser:kind,frames:0,immutableChecks:0,units:[],colorSamples:[]};
 await p.evaluate(()=>{window.savedAtlas=goonkBattleAtlas;const d=savedAtlas.getContext('2d').getImageData(0,0,savedAtlas.width,savedAtlas.height).data;window.savedAtlasBytes=new Uint8ClampedArray(d);});
 for(let i=0;i<45;i++){await p.waitForTimeout(80);const sample=await p.evaluate(()=>{const old=savedAtlas.getContext('2d').getImageData(0,0,savedAtlas.width,savedAtlas.height).data;let immutable=true;for(let j=0;j<old.length;j++)if(old[j]!==savedAtlasBytes[j]){immutable=false;break;}const c=goonkBattleAtlas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const colors=goonkBattleSpriteBounds.map((b,n)=>{let r=0,g=0,blue=0,count=0;for(let y=Math.floor(n/8)*128+8;y<Math.floor(n/8)*128+120;y++)for(let x=n%8*128+8;x<n%8*128+120;x++){const at=(y*c.width+x)*4;if(d[at+3]>240){r+=d[at];g+=d[at+1];blue+=d[at+2];count++;}}return{stack:b.stackId,count,r:r/count,g:g/count,b:blue/count};});const next=c!==savedAtlas;window.savedAtlas=c;window.savedAtlasBytes=new Uint8ClampedArray(d);return{immutable,next,colors};});assert(sample.immutable,'Previously published creature pixels changed during redraw');if(sample.next)report.frames++;report.immutableChecks++;report.colorSamples.push(sample.colors);}
 assert(report.frames>15,'Native animation keeps publishing fresh frames');assert(report.colorSamples.every(frame=>frame.filter(s=>s.count>0).length>=8),'All seven creature families, commander and opponents render');
 report.units=await p.evaluate(()=>goonkMobileState.battleUnits.map(u=>({stackId:u.stackId,key:u.key,name:u.name})));
 const byKey=key=>report.colorSamples.flatMap(frame=>frame.filter(s=>s.stack===report.units.find(u=>u.key==='core:'+key)?.stackId));
 for(const [key,sign]of [['fireElemental',1],['azureDragon',-1]]){const values=byKey(key);assert(values.length>20);assert(values.every(s=>(s.r-s.b)*sign>0),'Native red/blue palette stays correctly oriented for '+key);}
 assert.deepEqual(errors,[]);await p.screenshot({path:out+'/'+kind+'-portrait.png'});await p.setViewportSize({width:1180,height:820});await p.waitForTimeout(200);await p.screenshot({path:out+'/'+kind+'-landscape.png'});fs.writeFileSync(out+'/'+kind+'-report.json',JSON.stringify(report,null,2));console.log('PASS',kind,report.immutableChecks,'immutable-frame checks;',report.frames,'animated frames; red fire and blue dragon palettes stable');
}catch(e){await p.screenshot({path:out+'/'+kind+'-failed.png'});throw e;}finally{await browser.close();}

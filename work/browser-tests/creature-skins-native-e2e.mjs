import{chromium}from'playwright-core';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
const fixture=execFileSync('python3',['-c',`import zipfile,json,io,copy,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=json.loads(data);town=next(o for o in objects if o.get('instanceName')=='goonkTown');objects.remove(town)
   for i,faction in enumerate(['tower','inferno','necropolis','fortress']):
    o=copy.deepcopy(town);o.update({'subtype':'core:'+faction,'instanceName':'skinAuditTown'+str(i),'x':9+(i%2)*9,'y':9+(i//2)*9});o['options']['name']=faction;o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1']};objects.append(o)
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}),p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));const wait=f=>p.waitForFunction(f,null,{timeout:120000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8783/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',new Uint8Array(bytes)),[...fixture]);await cmd(20,1);await wait(()=>goonkMobileState.maps?.some(m=>m.name.startsWith('000')));await cmd(24,await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name.startsWith('000')).index));await p.waitForTimeout(250);await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.towns?.length===4);console.log('Native four-town fixture ready');
for(let i=0;i<4;i++){await cmd(5,i);await wait(()=>goonkMobileState.mode==='town');const faction=await p.evaluate(()=>goonkMobileState.townFaction);await cmd(29,4);await p.waitForTimeout(300);await cmd(54);await wait(()=>goonkMobileState.mode==='fort'&&goonkMobileState.fortFamilies?.some(f=>f.level===6&&f.variants.length>=4));const result=await p.evaluate(async()=>{const row=goonkMobileState.fortFamilies.find(f=>f.level===6),units=row.variants.slice(-2),atlas=goonkPortraitAtlas,ids=goonkPortraitIds;const hashes=[];for(const u of units){const index=ids.get(u.id);if(index===undefined)throw Error('Missing native portrait '+u.key);const data=atlas.getContext('2d').getImageData(index%8*96,Math.floor(index/8)*96,96,96).data,digest=await crypto.subtle.digest('SHA-256',data);hashes.push([...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join(''));}return{units:units.map(u=>({key:u.key,name:u.name,icon:u.icon})),hashes};});assert(result.units[0].icon.includes('tum-era/source-level8/'),faction+' uses isolated original graphics');assert.notEqual(result.hashes[0],result.hashes[1],faction+' native portraits must differ');console.log('PASS',faction,JSON.stringify(result.units));await cmd(43);await wait(()=>goonkMobileState.mode==='town');await cmd(0);await wait(()=>goonkMobileState.mode==='map');}
assert.deepEqual(errors,[]);
}finally{await browser.close();}

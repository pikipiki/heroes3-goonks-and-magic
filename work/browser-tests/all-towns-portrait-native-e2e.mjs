import{chromium}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import{execFileSync}from'node:child_process';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),report=[];
try{for(const faction of(process.env.TOWN_FACTIONS||'castle,rampart,tower,inferno,necropolis,dungeon,stronghold,fortress,conflux').split(',')){
 const p=await browser.newPage({viewport:{width:430,height:873},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));const wait=f=>p.waitForFunction(f,null,{timeout:90000}),cmd=(...v)=>p.evaluate(v=>Module._vcmiMobileCommand(...v),[...v,...Array(6-v.length).fill(0)]);
 try{await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery.phase==='done');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=json.loads(data)
   for o in objects:
    if o.get('instanceName')=='goonkTown':o['subtype']='core:'+sys.argv[1];o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1']}
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,faction]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await cmd(5,0);await wait(()=>goonkMobileState.mode==='town'&&document.querySelector('.town-portrait-buildings')?.hidden===false);assert.equal(await p.evaluate(()=>goonkMobileState.townFaction),'core:'+faction);
 const initial=await p.locator('.town-building-hit').count();assert(initial>1);await cmd(29,4);await p.waitForFunction(n=>document.querySelectorAll('.town-building-hit').length>n,initial);await p.waitForTimeout(300);const complete=await p.locator('.town-building-hit').count();assert(complete>=10);
 for(const [width,height]of[[430,873],[932,430],[844,280]]){await p.setViewportSize({width,height});await p.waitForTimeout(220);assert(await p.locator('.town-portrait-buildings').isVisible());const box=await p.locator('#mobile-scene').boundingBox();assert(width<height||box.height>=height-1);for(const b of await p.locator('.mobile-nav>button,.town-building-hit').all()){const r=await b.boundingBox();assert(r.x>=-.5&&r.y>=-.5&&r.x+r.width<=width+.5&&r.y+r.height<=height+.5,faction+' all controls inside visible surface '+JSON.stringify(r));}await p.screenshot({path:'/tmp/town-'+faction+'-'+width+'.png'});}
 assert.deepEqual(errors,[]);report.push({faction,initial,complete});console.log('PASS',faction,initial,'→',complete,'buildings; portrait, landscape, Android URL-bar height');
 }finally{await p.close();}
}}finally{fs.writeFileSync('/tmp/all-towns-portrait-report.json',JSON.stringify(report,null,2));await browser.close();}

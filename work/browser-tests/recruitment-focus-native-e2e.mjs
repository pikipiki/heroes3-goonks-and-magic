import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8993',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-recruitment-focus';fs.mkdirSync(out,{recursive:true});
const browser=await(process.env.TEST_BROWSER==='webkit'?webkit:chromium).launch({headless:true});const errors=[],cases=[];
try{for(const faction of ['tower','goonk']){
 const p=await browser.newPage({viewport:{width:360,height:716},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));
 const wait=(f,a)=>p.waitForFunction(f,a,{timeout:240000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
 await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery?.phase==='done');
 assert.equal(await p.evaluate(()=>typeof Module._vcmiAuditCreaturePreview),'undefined','Published engine contains no temporary native audit export');
 assert.deepEqual(await p.evaluate(()=>JSON.parse(Module.FS.readFile('/config/mobile-creature-focus.json',{encoding:'utf8'}))),JSON.parse(fs.readFileSync('work/vcmi-wasm/config/mobile-creature-focus.json','utf8')),'The release contains the exact offline camera table');
 const engine=await(await p.request.get(origin+'/engine-build.json')).json();if(process.env.EXPECTED_ENGINE_SHA)assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 const bytes=execFileSync('python3',['-c',String.raw`
import json,zipfile,io,sys,importlib.util
with zipfile.ZipFile('maps/000-Goonk.vmap') as z:entries={n:z.read(n) for n in z.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
if sys.argv[1]=='tower':
 town=next(o for o in objects if o['instanceName']=='goonkTown');town['subtype']='core:tower';town['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1']}
entries['objects.json']=json.dumps(objects).encode();header=json.loads(entries['header.json']);header['name']='000 - Preview focus';entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']=header['name'];entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for n,data in entries.items():z.writestr(n,data)
sys.stdout.buffer.write(out.getvalue())
`,faction]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/003-Goonks-WoG.vmap',new Uint8Array(bytes)),[...bytes]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.maps?.some(m=>m.name==='000 - Preview focus')&&goonkMobileState.lobbyReady);
 const index=await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name==='000 - Preview focus').index);await p.locator('#mobile-map-select').selectOption(String(index),{force:true});await wait(()=>goonkMobileState.selectedMap==='000 - Preview focus');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await cmd(5,0);await wait(()=>goonkMobileState.mode==='town');await p.locator('[data-ui=town-fort]').click();await wait(()=>goonkMobileState.mode==='fort');
 const units=await p.evaluate(()=>[goonkMobileState.fortFamilies[0].variants[0],goonkMobileState.fortFamilies[5].variants.find(u=>u.name==='Naga Empress')||goonkMobileState.fortFamilies[5].variants[0]].map(u=>({id:u.id,name:u.name})));
 for(const unit of units){
  await p.locator(`[data-family-select="${unit.id}"]`).click();await p.waitForTimeout(600);await wait(id=>goonkMobileState.previewUnits?.some(u=>u.id===id&&window.goonkCreaturePreviewRects?.has(u.previewKey??id)),unit.id);
  const motion=await p.evaluate(async ({id,name})=>{
   const u=goonkMobileState.previewUnits.findLast(u=>u.id===id&&goonkCreaturePreviewRects.has(u.previewKey??id)),r=goonkCreaturePreviewRects.get(u.previewKey??id),c=document.createElement('canvas');c.width=r.w;c.height=r.h;const ctx=c.getContext('2d',{willReadFrequently:true}),sheet=document.createElement('canvas');sheet.width=r.w*6;sheet.height=r.h*4;const sheetContext=sheet.getContext('2d');
   let first,changed=0,left=r.w,top=r.h,right=-1,bottom=-1;const versions=new Set(),canvases=new Set(),buffers=new Set();
   for(let n=0;n<24;n++){const rect=goonkCreaturePreviewRects.get(u.previewKey??id);ctx.clearRect(0,0,r.w,r.h);ctx.drawImage(goonkCreaturePreviewAtlas,rect.x,rect.y,rect.w,rect.h,0,0,r.w,r.h);sheetContext.drawImage(c,(n%6)*r.w,Math.floor(n/6)*r.h);const pixels=ctx.getImageData(0,0,r.w,r.h).data;versions.add(goonkCreaturePreviewVersion);canvases.add(goonkCreaturePreviewAtlas);buffers.add(window.goonkCreaturePreviewImageData);
   if(!first)first=pixels;else for(let i=0;i<pixels.length;i+=4)if(Math.abs(pixels[i]-first[i])+Math.abs(pixels[i+1]-first[i+1])+Math.abs(pixels[i+2]-first[i+2])>60){const x=(i/4)%r.w,y=Math.floor(i/4/r.w);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);changed++;}await new Promise(resolve=>setTimeout(resolve,120));}
   return {width:r.w,height:r.h,left,top,right,bottom,changed,versions:versions.size,canvasAllocations:canvases.size,pixelBufferAllocations:buffers.size,sheet:sheet.toDataURL()};
  },unit);
  fs.writeFileSync(`${out}/${faction}-${unit.id}-poses.png`,Buffer.from(motion.sheet.split(',')[1],'base64'));delete motion.sheet;
  await p.screenshot({path:`${out}/${faction}-${unit.id}-body-check.png`});
  // Measure the complete motion envelope. A disconnected clothing-color mask
  // does not measure the creature's size when an attack changes its silhouette.
  assert(motion.versions>2&&motion.changed>20,'The creature actually animates');assert.equal(motion.canvasAllocations,1,'The preview reuses one atlas canvas');assert.equal(motion.pixelBufferAllocations,1,'The preview reuses one pixel buffer');assert(motion.left>=1&&motion.top>=1&&motion.right<motion.width-1&&motion.bottom<motion.height-1,'All observed poses stay inside the preview margins '+JSON.stringify({unit,motion}));
  assert((motion.right-motion.left)/motion.width<.85&&(motion.bottom-motion.top)/motion.height<.85,'Motion remains within the 80% focus frame');
  assert(Math.max((motion.right-motion.left)/motion.width,(motion.bottom-motion.top)/motion.height)>.65,'The complete animation occupies a useful part of its fixed preview '+JSON.stringify({unit,motion}));
  cases.push({faction,unit:unit.name,motion});await p.screenshot({path:`${out}/${faction}-${unit.id}.png`});
 }
 await p.setViewportSize({width:716,height:335});await p.waitForTimeout(180);const fit=await p.locator('.hall-feature').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,stats:e.querySelector('.creature-stats').getBoundingClientRect().bottom,bottom:e.getBoundingClientRect().bottom}));assert(fit.scroll<=fit.height+1&&fit.stats<=fit.bottom+1,'Native stats fit on the actual landscape viewport');await p.screenshot({path:`${out}/${faction}-landscape.png`});await p.close();
}assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,cases,errors},null,2));console.log('PASS',cases.map(c=>c.faction+': '+c.unit));}finally{await browser.close();}

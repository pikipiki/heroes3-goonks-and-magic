import {chromium} from 'playwright-core';import fs from 'node:fs';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223'),context=browser.contexts()[0],page=await context.newPage();for(const other of context.pages())if(other!==page)await other.close();
const report={version:process.env.PROFILE_LABEL||'before',phases:[],errors:[],console:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(/fsUpdated|opfs|save|error/i.test(m.text()))report.console.push(m.text().slice(0,200));});
await page.addInitScript(()=>{
 const samples=window.freezeSamples={longTasks:[],gaps:[],handlers:[],fs:[],memory:[]};let last=0,lastTimer=performance.now();
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.duration>80)samples.longTasks.push({at:e.startTime,ms:e.duration});}).observe({type:'longtask',buffered:true});}catch{}
 window.addEventListener('goonk-state',e=>{const now=performance.now();if(last&&now-last>1500)samples.gaps.push({at:now,ms:now-last,mode:e.detail.mode});last=now;});
 const dispatch=window.dispatchEvent.bind(window);window.dispatchEvent=e=>{const t=performance.now();try{return dispatch(e);}finally{if(e.type==='goonk-state'&&performance.now()-t>10)samples.handlers.push({at:t,ms:performance.now()-t});}};
 setInterval(()=>{const now=performance.now();if(now-lastTimer>250)samples.gaps.push({at:now,ms:now-lastTimer,mode:'js-timer'});lastTimer=now;},100);
});
const wait=fn=>page.waitForFunction(fn,null,{timeout:60000}),click=name=>page.getByRole('button',{name,exact:true}).click();
async function phase(name,action,ms=6000){const start=await page.evaluate(()=>performance.now());if(action)await action();await page.waitForTimeout(ms);const data=await page.evaluate(start=>{const s=window.freezeSamples;return{longTasks:s.longTasks.filter(x=>x.at>=start),gaps:s.gaps.filter(x=>x.at>=start),handlers:s.handlers.filter(x=>x.at>=start),fs:s.fs.filter(x=>x.at>=start),heap:performance.memory?.usedJSHeapSize,wasm:Module.HEAPU8.buffer.byteLength};},start);report.phases.push({name,...data});console.log('PHASE',name,JSON.stringify(data));}
try{
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:8768/heroes-goonk/?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu');
 await page.evaluate(()=>{const opfs=Module.OPFS;for(const name of ['syncfs','getLocalSet','reconcile']){const original=opfs[name];if(!original)continue;opfs[name]=function(...args){const start=performance.now(),last=args.length-1,cb=args[last];if(typeof cb==='function')args[last]=function(...values){freezeSamples.fs.push({at:start,name,total:performance.now()-start});return cb(...values);};const result=original.apply(this,args);freezeSamples.fs.push({at:start,name,blocking:performance.now()-start});return result;};}});
 await click('Nouvelle aventure');await wait(()=>goonkMobileState.maps?.length);const map=(await page.evaluate(()=>goonkMobileState.maps)).find(x=>x.name.includes('Château Goonk'));await page.locator('#mobile-map-select').selectOption(String(map.index));await phase('start-game',async()=>{await click('Commencer');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);},6000);
 await phase('map-idle',null,10000);
 await phase('town-idle',async()=>{await click('♜ Villes');await click('Goonkbourg');await wait(()=>goonkMobileState.mode==='town');},8000);
 await phase('town-muted',async()=>{await click('Menu du jeu');const mute=page.getByRole('button',{name:'🔇 Couper le son',exact:true});if(await mute.count())await mute.click();await click('Fermer le menu');},8000);
 await phase('town-refresh-stress',async()=>{await click('Menu du jeu');await click('Codes de triche');await click('Appliquer : Or et ressources');await click('Appliquer : Tout construire dans la ville');await click('Fermer le menu');},8000);
 await phase('manual-save',async()=>{await click('↩ Carte');await wait(()=>goonkMobileState.mode==='map');await click('💾 Sauvegarder');},7000);
}catch(error){report.failure=error.stack;console.error(error.stack);}
fs.writeFileSync('../../outputs/freeze-profile-'+report.version+'.json',JSON.stringify(report,null,2));process.exit(report.failure?1:0);

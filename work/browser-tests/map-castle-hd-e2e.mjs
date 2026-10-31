import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
const out=name=>new URL('../../outputs/'+name,import.meta.url).pathname;
const root=new URL('../../',import.meta.url).pathname;
const hd=await sharp(root+'mod/goonk/Content/Sprites2x/goonk/map-town-v2.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(hd.info.width,384);assert.equal(hd.info.height,320);
const enlarged=await sharp(root+'mod/goonk/Content/Sprites/goonk/map-town-v2.png').resize(384,320).ensureAlpha().raw().toBuffer();
let detail=0;for(let i=0;i<enlarged.length;i++)detail+=Math.abs(enlarged[i]-hd.data[i]);
assert(detail/enlarged.length>1,'HD must contain original detail, not an enlarged 1x image');
const report={detailDifference:detail/enlarged.length,errors:[],serverErrors:[]};
const browser=await chromium.connectOverCDP('http://127.0.0.1:9224');
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(/Server encountered a problem|Assertion failed/i.test(m.text()))report.serverErrors.push(m.text());});
const click=name=>page.getByRole('button',{name,exact:true}).click();
try{
 await page.goto('http://127.0.0.1:8767/game.html?mobile=1');
 await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:120000});
 await click('Nouvelle aventure');await page.waitForFunction(()=>goonkMobileState.selectedMap==='Goonks');await click('Commencer');
 await page.waitForFunction(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName,null,{timeout:90000});
 await page.waitForTimeout(700);
 report.framebuffer=await page.locator('#canvas').evaluate(c=>[c.width,c.height]);assert.deepEqual(report.framebuffer,[1600,1200]);
 report.memoryMB=await page.evaluate(()=>Module.HEAPU8?.buffer.byteLength/1048576);
 report.blueRoofPixels=await page.locator('#mobile-scene').evaluate(c=>{
  const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0;
  for(let y=Math.floor(c.height*.26);y<c.height*.49;y++)for(let x=Math.floor(c.width*.2);x<c.width*.8;x++){
   const i=(y*c.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];if(r>30&&b>80&&b>r*1.25&&b>g*1.25)count++;
  }return count;
 });assert(report.blueRoofPixels>200,'The castle must keep its blue roofs, not the player-color overlay');
 await page.screenshot({path:out('map-castle-hd-portrait.png')});
 await click('Zoomer');await page.waitForTimeout(150);await page.screenshot({path:out('map-castle-hd-zoom.png')});
 await click('Recentrer sur le héros');
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(250);assert.deepEqual(await page.locator('#canvas').evaluate(c=>[c.width,c.height]),[1600,1200]);await page.screenshot({path:out('map-castle-hd-landscape.png')});
 await page.setViewportSize({width:390,height:844});await click('♜ Villes');await page.locator('.sheet-body button').first().click();await page.waitForFunction(()=>goonkMobileState.mode==='town');
 const dwelling=await page.evaluate(()=>goonkMobileState.buildings.find(b=>b.built&&b.key.endsWith(':dwellingLvl1')));await page.locator('[data-town-building="'+dwelling.id+'"]').click();
 await page.waitForFunction(()=>goonkMobileState.mode==='recruit'&&goonkMobileState.recruitUnit);report.recruitment=await page.evaluate(()=>goonkMobileState.recruitUnit.name);await page.screenshot({path:out('map-castle-hd-recruit.png')});
 await click('Fermer le recrutement');await page.waitForFunction(()=>goonkMobileState.mode==='town');await click('Carte');await page.waitForFunction(()=>goonkMobileState.mode==='map');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.serverErrors,[]);console.log(JSON.stringify(report));
}catch(e){report.failure=e.stack;await page.screenshot({path:out('map-castle-hd-failure.png')});throw e;}
finally{fs.writeFileSync(out('map-castle-hd-e2e.json'),JSON.stringify(report,null,2));await context.close();await browser.close();}

import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.REAL_UI_ORIGIN||'http://127.0.0.1:8941';
const output=process.env.REAL_UI_CAPTURE_OUTPUT||'/tmp/heroes-real-ui-captures';fs.mkdirSync(output,{recursive:true});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const report={scope:'Real native game and production UI factories; CSS-only design preview',engineArchive:'outputs/vcmi-wasm-goonk-0.4.272-engine.tar.gz',engineArchiveSha256:sha(fs.readFileSync('outputs/vcmi-wasm-goonk-0.4.272-engine.tar.gz')),prototypeCssSha256:sha(fs.readFileSync('docs/design-prototypes/material3/real-prototype.css')),samples:[],errors:[]};
const screens=[['town','Château'],['fort','Hall de recrutement'],['hero','Armée du héros'],['equipment','Équipement du héros'],['skills','Compétences du héros'],['marketplace','Marché'],['mageGuild1','Guilde des mages'],['tavern','Recrutement des héros'],['blacksmith','Machines de guerre'],['spellbook','Grimoire'],['map','Carte d’aventure'],['settings','Paramètres']];
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}});await silenceTestAudio(page);
 await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(origin+'/real-preview.html');
 await page.waitForFunction(()=>window.realPrototype?.ready(),null,{timeout:240000});
 const frame=page.frameLocator('#game');
 for(const [screen,label]of screens){
  await page.evaluate(screen=>realPrototype.openScreen(screen),screen);
  await page.waitForTimeout(900);
  for(const [width,height]of [[360,640],[320,568],[640,360],[568,280]]){
   await page.selectOption('#size',width+','+height);await page.waitForTimeout(180);
   for(const design of ['current','heroes']){
    await page.selectOption('#design',design);await page.waitForTimeout(180);
    const metadata=await frame.locator('html').evaluate((html)=>{
     const s=goonkMobileState;
     return {viewport:{width:innerWidth,height:innerHeight},mode:s.mode,dialogKind:s.dialogKind||null,nativeWindowToken:s.windowToken,hasNativeEngine:typeof Module._vcmiMobileCommand==='function'&&!!Module.HEAPU8,canvases:[...document.querySelectorAll('#mobile-app canvas')].filter(c=>c.getBoundingClientRect().width>0).length,placeholderCount:document.querySelectorAll('.hg-device,.hg-battle,.hg-map,.hg-art').length};
    });
    assert.deepEqual(metadata.viewport,{width,height},'Exact inner viewport');
    assert(metadata.hasNativeEngine,'Real WASM engine must be running');assert.equal(metadata.placeholderCount,0,'No handcrafted mock widgets');
    const image=await frame.locator('#mobile-app').screenshot({type:'jpeg',quality:87});
    const digest=sha(image),file=`${screen}-${width}x${height}-${design}-${digest.slice(0,12)}.jpg`;
    fs.writeFileSync(path.join(output,file),image);
    report.samples.push({screen,label,width,height,design,file,sha256:digest,...metadata});
   }
  }
  console.log('Captured real native screen:',screen);
 }
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS',report.samples.length,'real native captures; no mocked engine, UI models or placeholder art');
}finally{await browser.close();}

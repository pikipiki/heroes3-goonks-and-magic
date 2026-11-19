import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
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
 if(process.env.REAL_UI_REF)await page.route('**/web/**',route=>{const file='web/'+new URL(route.request().url()).pathname.split('/web/')[1];if(/\.(mjs|css)$/.test(file)){try{return route.fulfill({body:execFileSync('git',['show',process.env.REAL_UI_REF+':'+file],{stdio:'pipe'}),contentType:file.endsWith('.css')?'text/css':'text/javascript'});}catch{}}return route.continue();});
 await page.goto(origin+'/real-preview.html');
 await page.waitForFunction(()=>window.realPrototype?.ready(),null,{timeout:240000});
 const frame=page.frameLocator('#game');
 for(const [screen,label]of screens.filter(([screen])=>!process.env.REAL_UI_SCREENS||process.env.REAL_UI_SCREENS.split(',').includes(screen))){
  await page.evaluate(screen=>realPrototype.openScreen(screen),screen);
  await page.waitForTimeout(900);
  for(const [width,height]of [[360,640],[320,568],[640,360],[568,280]]){
   await page.selectOption('#size',width+','+height);await page.waitForTimeout(180);
   for(const design of (process.env.REAL_UI_DESIGNS||'current,heroes').split(',')){
    await page.selectOption('#design',design);await page.waitForTimeout(180);
    const metadata=await frame.locator('html').evaluate((html)=>{
     const s=goonkMobileState;
     return {viewport:{width:innerWidth,height:innerHeight},mode:s.mode,dialogKind:s.dialogKind||null,nativeWindowToken:s.windowToken,hasNativeEngine:typeof Module._vcmiMobileCommand==='function'&&!!Module.HEAPU8,canvases:[...document.querySelectorAll('#mobile-app canvas')].filter(c=>c.getBoundingClientRect().width>0).length,placeholderCount:document.querySelectorAll('.hg-device,.hg-battle,.hg-map,.hg-art').length,visualGeometry:[...document.querySelectorAll('.hall-art canvas,.creature-stage canvas,.hero-face,.hero-army-slot-art canvas,.hero-army-slot-art img,.tavern-hero canvas,.blacksmith-unit canvas')].filter(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height&&!n.closest('[hidden]')).map(n=>{const r=n.getBoundingClientRect();return {tag:n.tagName,key:n.className?.baseVal??n.className,subject:n.dataset.hallIcon??null,width:r.width,height:r.height,sourceWidth:n.width,sourceHeight:n.height};})};
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

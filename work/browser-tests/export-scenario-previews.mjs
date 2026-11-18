// Offline preparation: ship the engine's terrain previews so a phone never has
// to parse the complete map catalogue merely to browse the scenario picker.
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
const previous=fs.existsSync('web/scenario-previews.json')?JSON.parse(fs.readFileSync('web/scenario-previews.json')):{};
const terrainResources=new Set([...(previous.terrainOnly||[]),...(previous.unavailable||[])]);
const browser=await chromium.launch({headless:true});
try{
 let page;
 async function boot(){
  if(page)await page.close();
  page=await browser.newPage({viewport:{width:430,height:873}});await silenceTestAudio(page);
  page.on('pageerror',error=>console.error('Engine:',error.message));
  await page.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8997')+'/game.html?mobile=1');
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,{timeout:180000});
  await page.evaluate(()=>Module._vcmiMobileCommand(20,1,0,0,0,0));
  await page.waitForFunction(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length>300&&!goonkMobileState.mapsLoading,null,{timeout:180000});
 }
 await boot();
 const maps=await page.evaluate(()=>goonkMobileState.maps),checkpoint='/tmp/scenario-previews-checkpoint.json';
 fs.writeFileSync('/tmp/scenario-preview-maps.json',JSON.stringify(maps));
 const previews=process.env.RESUME_PREVIEWS&&fs.existsSync(checkpoint)?JSON.parse(fs.readFileSync(checkpoint)).previews:{},failed=[],terrainOnly=[];
 async function preview(path){return page.evaluate(path=>new Promise(resolve=>{
  const key=path.toUpperCase().replace(/\.(?:H3M|VMAP)$/,'');
  const done=images=>{clearTimeout(timer);removeEventListener('goonk-map-preview',listener);resolve(images);};
  const listener=event=>{if(event.detail.key.toUpperCase().replace(/\.(?:H3M|VMAP)$/,'')===key)done(event.detail.images||[]);};
  const timer=setTimeout(()=>done([]),10000);addEventListener('goonk-map-preview',listener);
  const ptr=Module._malloc(Module.lengthBytesUTF8(path)+1);try{Module.stringToUTF8(path,ptr,Module.lengthBytesUTF8(path)+1);Module._vcmiMobilePreviewMap(ptr);}finally{Module._free(ptr);}
 }),path);}
 for(const [index,map]of maps.entries()){
  const key=map.path.toUpperCase().replace(/\.(?:H3M|VMAP)$/,'');
  if(previews[key])continue;
  if(terrainResources.has(key)){try{previews[key]=JSON.parse(execFileSync('python3',['scripts/scenario-previews.py','terrain',map.path],{maxBuffer:2000000}));terrainOnly.push(key);}catch{previews[key]=[];failed.push({path:map.path,name:map.name});}continue;}
  let images=await preview(map.path);
  if(!images.length){console.log('Retrying in a fresh engine',map.path);await boot();images=await preview(map.path);}
  if(!images.length){try{images=JSON.parse(execFileSync('python3',['scripts/scenario-previews.py','terrain',map.path],{maxBuffer:2000000}));terrainOnly.push(key);}catch{failed.push({path:map.path,name:map.name});previews[key]=[];}await boot();}
  if(images.length)previews[key]=images;
  if((index+1)%20===0)console.log(index+1+'/'+maps.length,'prepared');
  fs.writeFileSync('/tmp/scenario-previews-checkpoint.json',JSON.stringify({count:maps.length,previews,failed,terrainOnly}));
 }
 if(failed.length)console.warn('Unavailable terrain previews: '+JSON.stringify(failed));
 const output={schema:1,count:maps.length,size:128,terrainOnly,unavailable:failed.map(map=>map.path.toUpperCase()),previews};
 fs.writeFileSync('web/scenario-previews.json',execFileSync('python3',['scripts/scenario-previews.py','pack'],{input:JSON.stringify(output),maxBuffer:20000000}));
 const revision=createHash('sha256').update(fs.readFileSync('web/scenario-previews.json')).digest('hex').slice(0,16);
 fs.writeFileSync('web/scenario-preview.mjs',fs.readFileSync('web/scenario-preview.mjs','utf8').replace(/const catalogueRevision='[a-f0-9]+';/,"const catalogueRevision='"+revision+"';"));
 console.log('Prepared',output.count,'native map previews;',fs.statSync('web/scenario-previews.json').size,'bytes');
}finally{await browser.close();}

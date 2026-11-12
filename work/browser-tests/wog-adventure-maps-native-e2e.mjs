import {chromium} from 'playwright-core';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';

const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8796';
const output=process.env.REVIEW_OUTPUT||'/tmp/goonk-wog-adventure-maps-native';
fs.mkdirSync(output,{recursive:true});
const manifest=await fetch(origin+'/asset-manifest.json').then(r=>{assert(r.ok);return r.json()});
const engineBuild=await fetch(origin+'/engine-build.json').then(r=>{assert(r.ok);return r.json()});
const browser=await chromium.launch({headless:true}), results=[];
let page;
try{
 for(const [filename,humans] of [['003-Goonks-WoG.vmap',1],['004-Goonks-WoG-Online.vmap',2]]){
  page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});
  await silenceTestAudio(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>fs.appendFileSync(output+'/console.log',m.type()+': '+m.text()+'\n'));
  page.on('requestfailed',r=>fs.appendFileSync(output+'/network.log',r.url()+' '+r.failure()?.errorText+'\n'));
  console.log('Booting',filename);
  await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
  await page.goto(origin+'/game.html?mobile=1');
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,{timeout:240000});
  console.log('Native menu ready',filename);
  const title=execFileSync('python3',['-c',"import zipfile,json,sys;print(json.loads(zipfile.ZipFile('maps/'+sys.argv[1]).read('header.json'))['name'])",filename],{encoding:'utf8'}).trim();
  // Load the catalogue entry from the actual public asset manifest. This also
  // catches missing publication or a manifest that still points at an old map.
  const entry=manifest.files.find(f=>f.path==='Maps/'+filename);assert(entry,'Published map manifest entry');
  const response=await fetch(new URL(entry.url,origin+'/'));assert(response.ok,'Published map bytes');
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.hash,'Published map SHA');
  await page.evaluate(({filename,bytes})=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/'+filename,new Uint8Array(bytes)),{filename,bytes:[...bytes]});
  const command=(...args)=>page.evaluate(a=>Module._vcmiMobileCommand(...a),[...args,...Array(6-args.length).fill(0)]);
  await command(20,humans);
  await page.waitForFunction(title=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.some(m=>m.name===title),title,{timeout:90000});
  const map=await page.evaluate(title=>goonkMobileState.maps.find(m=>m.name===title),title);
  await command(24,map.index);
  await page.waitForFunction(title=>goonkMobileState.selectedMap===title,title);
  await page.screenshot({path:output+'/'+filename+'.lobby.png'});
  // Returning from the native options must preserve an explicitly chosen
  // public scenario, including the second adventure rather than the default.
  await page.evaluate(()=>Module._vcmiMobileEnable(2));
  await page.evaluate(()=>Module._vcmiMobilePointer(500,520,1));
  await page.waitForTimeout(250);
  await page.evaluate(()=>Module._vcmiMobilePointer(132,166,1));
  await page.waitForTimeout(250);
  await page.evaluate(()=>Module._vcmiMobilePointer(400,355,1));
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>goonkMobileState.selectedMap),title,'Native options preserve selected public adventure');
  await page.evaluate(()=>Module._vcmiMobileEnable(1));
  await command(22);
  await page.waitForFunction(()=>['map','dialog'].includes(goonkMobileState.mode)&&goonkMobileState.turn,null,{timeout:120000});
  if(await page.evaluate(()=>goonkMobileState.mode==='dialog'))await command(1);
  await page.waitForFunction(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn,null,{timeout:30000});
  const state=await page.evaluate(()=>goonkMobileState);
  assert.equal(state.mapOverview.width,144);assert.deepEqual(errors,[]);
  results.push({filename,title,map,loaded:true,width:state.mapOverview.width,mapSHA256:entry.hash,engineBuild,errors});
  await page.screenshot({path:output+'/'+filename+'.map.png'});
  await page.close();page=null;
 }
 fs.writeFileSync(output+'/result.json',JSON.stringify(results,null,2));
 console.log('Both published WoG adventures appear in the native catalogue and start successfully.');
}catch(error){if(page){fs.writeFileSync(output+'/failure-state.json',JSON.stringify((await page.evaluate(()=>window.goonkMobileState).catch(()=>null))??null,null,2));await page.screenshot({path:output+'/failure.png'}).catch(()=>{});}throw error;}
finally{await browser.close();}

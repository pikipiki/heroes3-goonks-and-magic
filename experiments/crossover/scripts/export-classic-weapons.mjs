// Capture real OpenBW projectiles and Interceptors; no external replacement art.
import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const browser=await chromium.launch({headless:true});const results={};
try{for(const [name,type,health]of [['battlecruiser',12,500],['siegeTank',5,150],['guardian',44,150],['archon',68,360],['carrier',72,500]]){
 const page=await browser.newPage();await silenceTestAudio(page);await page.addInitScript(()=>{for(const method of ['instantiate','instantiateStreaming']){const original=WebAssembly[method].bind(WebAssembly);WebAssembly[method]=async(...args)=>{const result=await original(...args),instance=result.instance||result;if(instance.exports.openbw_crossover_setup)window.weaponEngine=instance.exports;return result;};}});
 await page.goto(process.env.CROSSOVER_ART_URL||'http://127.0.0.1:8786/heroes-starcraft/starcraft/index.html');await page.waitForFunction(()=>window.openbwPrepareCrossover);await page.evaluate(()=>openbwPrepareCrossover());
 results[name]=await page.evaluate(async({name,type,health})=>{
  await openbwLaunchCrossover({version:1,battleId:2000+type,stacks:[{id:0,side:0,unit:type,count:1,heroes:false,health,damageMin:1,damageMax:1,attack:0,defense:0,speed:8,shooter:true,x:180,y:250},{id:1,side:1,unit:0,count:1,heroes:true,health:10000,damageMin:0,damageMax:0,attack:0,defense:0,speed:1,shooter:false,x:650,y:250}]});const api=openbwCrossover,x=weaponEngine;api.pause();const enemy=api.census().units.find(u=>u.stackId===1);api.target(0,enemy.id);const flight=Array.from({length:32},()=>[]),impact=[],fighters=Array.from({length:32},()=>[]),states={},weapons=new Set();let checked=false,visible=0;
  const raw=(kind,id,heading)=>{const ptr=x.openbw_crossover_fx_sprite(kind,id,heading);return ptr?new Uint8ClampedArray(x.memory.buffer,ptr,96*96*4).slice():null;};
  const png=(bytes,size,scale)=>{const source=document.createElement('canvas');source.width=source.height=96;source.getContext('2d').putImageData(new ImageData(bytes,96,96),0,0);const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,size/2-48*scale,size/2-48*scale,96*scale,96*scale);return c.toDataURL('image/png').split(',')[1];};
  for(let frame=0;frame<1000;frame++){x.openbw_crossover_ai_tick();x.openbw_step();const effects=api.effects().rows.filter(e=>e.source===0);const target=api.census().units.find(u=>u.stackId===1);
   for(const effect of effects){weapons.add(effect.weapon);states[effect.state]=(states[effect.state]||0)+1;visible++;const hit=effect.state===5||Math.hypot(effect.x-target.x,effect.y-target.y)<28;
    if(hit&&impact.length<16){const bytes=raw(0,effect.id,-1);if(bytes)impact.push(png(bytes,192,2));}
    else if(!hit&&flight[0].length<8){const before=raw(0,effect.id,-1);for(let d=0;d<32;d++){const bytes=raw(0,effect.id,d*8);if(bytes)flight[d].push(png(bytes,name==='battlecruiser'?192:96,2));}if(!checked){const after=raw(0,effect.id,-1);if(before.some((v,i)=>v!==after[i]))throw Error('Directional capture modified a live projectile');checked=true;}}
   }
   if(name==='carrier'&&fighters[0].length<8&&frame%3===0){const child=api.census().units.find(u=>u.auxiliary);if(child)for(let d=0;d<32;d++){const bytes=raw(1,child.id,d*8);if(bytes)fighters[d].push(png(bytes,64,1.5));}}
   if(flight[0].length>=8&&impact.length>=12&&(name!=='carrier'||fighters[0].length>=8))break;
  }
  if(!visible)throw Error(name+' emitted no native weapon sprites');if(name==='carrier'&&!fighters[0].length)throw Error('No native Interceptors');return {flight,impact,fighters,evidence:{weapons:[...weapons],states,flightFrames:flight[0].length,impactFrames:impact.length,fighterFrames:fighters[0].length,visible}};
 },{name,type,health});console.log(name,results[name].evidence);await page.close();
}}finally{await browser.close();}
const root=new URL('../../../mod/heroes-starcraft/content/sprites/crossover/weapons/',import.meta.url);fs.mkdirSync(root,{recursive:true});for(const file of fs.readdirSync(root))if(/\.(png|json)$/.test(file))fs.unlinkSync(new URL(file,root));const unique=new Map();
const frame=(name,phase,direction,index,data)=>{const hash=crypto.createHash('sha256').update(data).digest('hex');if(unique.has(hash))return unique.get(hash);const file=`${name}-${phase}-${direction}-${index}.png`;fs.writeFileSync(new URL(file,root),Buffer.from(data,'base64'));const path='crossover/weapons/'+file;unique.set(hash,path);return path;};
for(const [name,result]of Object.entries(results)){const sequences=result.flight.map((rows,group)=>({group,frames:rows.map((data,i)=>frame(name,'flight',group,i,data))}));sequences.push({group:32,frames:result.impact.map((data,i)=>frame(name,'impact',0,i,data))});fs.writeFileSync(new URL(name+'.json',root),JSON.stringify({sequences})+'\n');if(name==='carrier')fs.writeFileSync(new URL('interceptor.json',root),JSON.stringify({sequences:result.fighters.map((rows,group)=>({group,frames:rows.map((data,i)=>frame('interceptor','flight',group,i,data))}))})+'\n');}
execFileSync('python3',['-c',`from PIL import Image
from pathlib import Path
import sys
for p in Path(sys.argv[1]).glob('*.png'):
 rgba=Image.open(p).convert('RGBA');indexed=rgba.convert('RGB').quantize(colors=216,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
 data=bytes(v+8 if a>=96 else 0 for v,a in zip(indexed.tobytes(),rgba.getchannel('A').tobytes()));im=Image.frombytes('P',rgba.size,data)
 im.putpalette([0,255,255,255,150,255,255,100,255,255,50,255,255,0,255,255,255,0,180,0,255,0,255,0]+indexed.getpalette()[:648]+[0]*96);im.save(p,optimize=True,transparency=0)
`,fileURLToPath(root)]);
const config=new URL('../../../mod/heroes-starcraft/content/config/late-units.json',import.meta.url),units=JSON.parse(fs.readFileSync(config));for(const name of Object.keys(results)){delete units[name].graphics.missile.ray;units[name].graphics.missile.projectile='crossover/weapons/'+name;}fs.writeFileSync(config,JSON.stringify(units,null,2)+'\n');
fs.writeFileSync(new URL('../evidence/classic-weapons.json',import.meta.url),JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,v])=>[k,v.evidence])),null,2)+'\n');console.log('Original weapon images:',unique.size);

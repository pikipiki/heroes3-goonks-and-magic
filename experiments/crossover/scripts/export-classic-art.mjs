// Export original OpenBW frames/sounds once; classic combat itself runs only in VCMI.
import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {STARCRAFT_NATIVE_SCALE} from '../public/sprite-scale.js';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const selected=process.env.CROSSOVER_ART_UNITS?.split(',');
const browser=await chromium.launch({headless:true});
try{
 const result={};for(const [name,type]of Object.entries({marine:0,firebat:32,zergling:37,hydralisk:38,zealot:65,dragoon:66,siegeTank:5,battlecruiser:12,ultralisk:39,guardian:44,archon:68,carrier:72})){if(selected&&!selected.includes(name))continue;
 const page=await browser.newPage();await silenceTestAudio(page);
 await page.addInitScript(()=>{window.exportSounds=new Map();window.exportPlayed=[];for(const method of ['instantiate','instantiateStreaming']){const original=WebAssembly[method].bind(WebAssembly);WebAssembly[method]=async(input,imports)=>{if(imports?.env?.js_sound_load){const load=imports.env.js_sound_load,play=imports.env.js_sound_play;imports.env.js_sound_load=(ptr,size)=>{const id=load(ptr,size);exportSounds.set(id,new Uint8Array(exportEngine.memory.buffer,ptr,size).slice());return id;};imports.env.js_sound_play=(id,...args)=>{exportPlayed.push({id,phase:window.exportPhase});return play(id,...args);};}const result=await original(input,imports),instance=result.instance||result;if(instance.exports.openbw_frame)window.exportEngine=instance.exports;return result;};}});
 await page.goto(process.env.CROSSOVER_ART_URL||'http://127.0.0.1:8784/heroes-starcraft/starcraft/index.html');await page.waitForFunction(()=>window.openbwPrepareCrossover);await page.evaluate(()=>openbwPrepareCrossover());
 const captured=await page.evaluate(async({name,type,nativeScale})=>{
  const {setupNativeBattle}=await import('../native-bridge.js');const definitions={[name]:type},output={};
  const plan=type=>({version:1,battleId:800+type,stacks:[{id:0,side:0,unit:type,count:1,heroes:false,health:100,damageMin:1,damageMax:1,attack:0,defense:0,speed:6,shooter:![37,39,65].includes(type)},{id:1,side:1,unit:0,count:1,heroes:true,health:10000,damageMin:0,damageMax:0,attack:0,defense:1000,speed:1,shooter:false}]});
  await openbwLaunchCrossover(plan(type));const api=openbwCrossover,x=exportEngine;api.pause();
  for(const [name,type]of Object.entries(definitions)){
   const reset=()=>{setupNativeBattle(x,x.memory,plan(type));api.pause();return api.census().units.find(u=>u.stackId===0);};let unit=reset();const flip=api.census().units.find(u=>u.stackId===1).x<unit.x;const poses={idle:[],move:[],attack:[],death:[]};
   const capture=()=>{try{return [...api.sprite(unit.id)];}catch{return null;}};
   const step=n=>{for(let i=0;i<n;i++){const c=api.census(),u=c.units.find(u=>u.id===unit.id);if(u)x.openbw_pan(Math.round(u.x-c.view.x-c.view.width/2),Math.round(u.y-c.view.y-c.view.height/2));x.openbw_crossover_ai_tick?.();x.openbw_step();}};
   exportPhase=name+':idle';api.order(0,350,50,false);step(20);api.stop(0);step(4);for(let i=0;i<8;i++){poses.idle.push(capture());step(3);}
   exportPhase=name+':move';const camera=api.camera();api.order(0,350,250,false);for(let i=0;i<8;i++){step(3);poses.move.push(capture());}
   unit=reset();const target=api.census().units.find(u=>u.stackId===1);api.target(0,target.id);exportPhase=name+':approach';let reached=false;for(let i=0;i<600;i++){step(1);const u=api.census().units.find(u=>u.id===unit.id);if(u.cooldown>0||(type===72&&api.census().units.some(v=>v.auxiliary&&v.cooldown>0))){reached=true;break;}}if(!reached)throw Error(name+' never attacks: '+JSON.stringify(api.census()));exportPhase=name+':attack';
   for(let i=0;i<16;i++){poses.attack.push(capture());step(2);}
   exportPhase=name+':death';const current=api.census().units.find(u=>u.id===unit.id);api.applyMagic([{id:0,owner:0,side:0,count:0,hp:0,maxHp:100,attack:0,defense:0,damageMin:1,damageMax:1,speed:6,shooter:![37,39,65].includes(type),x:400,y:250,disabled:false,berserk:false,cloned:false,moved:false,meleeReduction:0,rangedReduction:0,fireShield:0,healthDelta:-current.hp,revived:0,removed:true,creature:'heroes-starcraft:'+name,luck:0,morale:0,retaliations:0}]);
   for(let i=0;i<12;i++){step(4);poses.death.push(capture()||new Array(160*160*4).fill(0));}
   // Use a constant native-to-Heroes scale and foot anchor for every pose.
   const idle=poses.idle[0];let l=160,t=160,r=0,b=0;for(let y=0;y<160;y++)for(let xx=0;xx<160;xx++)if(idle[(y*160+xx)*4+3]){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,y);b=Math.max(b,y);}const scale=nativeScale;
   const frames={};for(const [pose,list]of Object.entries(poses))frames[pose]=list.map(raw=>{const source=document.createElement('canvas');source.width=source.height=160;source.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(raw),160,160),0,0);const c=document.createElement('canvas');c.width=450;c.height=400;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(flip){ctx.translate(450,0);ctx.scale(-1,1);}ctx.drawImage(source,225-(l+r+1)/2*scale,265-(b+1)*scale,160*scale,160*scale);return c.toDataURL('image/png').split(',')[1];});
   const sounds={};for(const kind of ['attack','death']){const counts=new Map();for(const event of exportPlayed)if((event.phase===name+':'+kind||(kind==='attack'&&event.phase===name+':approach'))&&exportSounds.has(event.id))counts.set(event.id,(counts.get(event.id)||0)+1);const [id]=[...counts].sort((a,b)=>b[1]-a[1])[0]||[];if(id!==undefined)sounds[kind]=[...exportSounds.get(id)];}output[name]={frames,sounds,nativeBounds:{width:r-l+1,height:b-t+1},nativeScale:scale};
  }return output;
 },{name,type,nativeScale:STARCRAFT_NATIVE_SCALE});Object.assign(result,captured);await page.close();
 }
 const root=new URL('../../../mod/heroes-starcraft/content/',import.meta.url),evidence=selected?JSON.parse(fs.readFileSync(new URL('../evidence/classic-art.json',import.meta.url))):{};const mapTemplate=JSON.parse(fs.readFileSync(new URL('sprites/crossover/marine-map.json',root)));for(const file of fs.readdirSync(new URL('sprites/crossover/',root)))if((!selected||selected.includes(file.split('-')[0]))&&/^(marine|firebat|zergling|hydralisk|zealot|dragoon|siegeTank|battlecruiser|ultralisk|guardian|archon|carrier)-(idle|move|attack|death)-\d+\.png$/.test(file))fs.unlinkSync(new URL('sprites/crossover/'+file,root));
 for(const [name,{frames,sounds,nativeBounds,nativeScale}]of Object.entries(result)){
  const files={},unique=new Map();for(const [pose,rows]of Object.entries(frames)){files[pose]=[];rows.forEach((data,i)=>{const hash=crypto.createHash('sha256').update(data).digest('hex');let file=unique.get(hash);if(!file){file=`crossover/${name}-${pose}-${i}.png`;unique.set(hash,file);fs.writeFileSync(new URL('sprites/'+file,root),Buffer.from(data,'base64'));}files[pose].push(file);});}
  const groups={0:files.move,1:files.idle,2:files.idle,3:files.idle,4:files.idle,5:files.death,6:files.death,7:files.idle.slice(0,2),8:files.idle.slice(0,2),11:files.attack,12:files.attack,13:files.attack,14:files.attack,15:files.attack,16:files.attack,17:files.attack,18:files.attack,19:files.attack,20:files.move.slice(0,2),21:files.move.slice(-2),22:['crossover/starcraft-dead.png'],23:['crossover/starcraft-dead.png'],24:[...files.death].reverse(),25:files.idle.slice(0,1),30:files.attack,31:files.attack,32:files.attack};
  fs.writeFileSync(new URL('sprites/crossover/'+name+'.json',root),JSON.stringify({sequences:Object.entries(groups).map(([group,frames])=>({group:Number(group),frames}))},null,2)+'\n');
  fs.writeFileSync(new URL('sprites/crossover/'+name+'-map.json',root),JSON.stringify({sequences:mapTemplate.sequences.map(row=>({...row,frames:row.frames.map(()=>`crossover/${name}.png`)}))},null,2)+'\n');
  fs.mkdirSync(new URL('sounds/crossover/',root),{recursive:true});for(const [kind,bytes]of Object.entries(sounds))fs.writeFileSync(new URL(`sounds/crossover/${name}-${kind}.wav`,root),Buffer.from(bytes));
  evidence[name]={nativeBounds,nativeScale,frames:Object.fromEntries(Object.entries(frames).map(([pose,rows])=>[pose,{count:rows.length,distinct:new Set(rows.map(data=>crypto.createHash('sha256').update(data).digest('hex'))).size}])),sounds:Object.keys(sounds)};console.log(name,evidence[name]);
 }
 // Heroes animations use a fixed 450×400 frame and the native 225,265 foot anchor.
 // Heroes COLORKEY requires transparent palette index 0; reserve player-colour slots too.
 execFileSync('python3',['-c',`from PIL import Image
from pathlib import Path
import sys
for p in Path(sys.argv[1]).glob('*-*-*.png'):
 rgba=Image.open(p).convert('RGBA')
 indexed=rgba.convert('RGB').quantize(colors=216,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
 pixels=bytes(value+8 if alpha>=128 else 0 for value,alpha in zip(indexed.tobytes(),rgba.getchannel('A').tobytes()))
 im=Image.frombytes('P',rgba.size,pixels)
 im.putpalette([0,255,255,255,150,255,255,100,255,255,50,255,255,0,255,255,255,0,180,0,255,0,255,0]+indexed.getpalette()[:216*3]+[0]*96)
 im.save(p,optimize=True,transparency=0)
for name in sys.argv[2].split(','):
 p=Path(sys.argv[1])/f'{name}-idle-0.png'
 im=Image.open(p).convert('RGBA').crop((161,149,289,277)).resize((96,96),Image.Resampling.LANCZOS)
 im.save(p.with_name(name+'.png'),optimize=True)
`,fileURLToPath(new URL('sprites/crossover/',root)),Object.keys(result).join(',')]);
 for(const file of ['marine.json','mixed-units.json','late-units.json']){const path=new URL('config/'+file,root),units=JSON.parse(fs.readFileSync(path));for(const [name,unit]of Object.entries(units)){unit.sound??={};for(const [kind,field]of [['attack','attack'],['attack','shoot'],['death','killed']])if(fs.existsSync(new URL(`sounds/crossover/${name}-${kind}.wav`,root)))unit.sound[field]=`crossover/${name}-${kind}.wav`;}fs.writeFileSync(path,JSON.stringify(units,null,2)+'\n');}
 fs.writeFileSync(new URL('../evidence/classic-art.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
}finally{await browser.close();}

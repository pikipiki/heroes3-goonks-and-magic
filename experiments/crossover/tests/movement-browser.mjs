// Isolated native movement contract. No Heroes battle result or health is fabricated.
import {chromium, webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
for(const [name,type] of Object.entries({chromium,webkit}).filter(([n])=>!process.env.CROSSOVER_BROWSER||n===process.env.CROSSOVER_BROWSER)) {
 const browser=await type.launch({headless:true});
 try {
  for(const definition of [['Marine',0,false,40],['Firebat',32,false,50],['Zergling',37,false,35],['Hydralisk',38,false,80],['Zealot',65,false,160],['Dragoon',66,false,180],['Heroes melee',37,true,300],['Heroes shooter',0,true,300]]) {
  const page=await browser.newPage();await silenceTestAudio(page);
  await page.addInitScript(()=>{for(const method of ['instantiate','instantiateStreaming']){const original=WebAssembly[method].bind(WebAssembly);WebAssembly[method]=async(...args)=>{const result=await original(...args),instance=result.instance||result;if(instance.exports.openbw_crossover_setup)window.movementEngine=instance.exports;return result;};}});
  await page.goto(process.env.CROSSOVER_ART_URL||'http://127.0.0.1:8784/heroes-starcraft/starcraft/index.html');
  await page.waitForFunction(()=>window.openbwPrepareCrossover);await page.evaluate(()=>openbwPrepareCrossover());
  
  const results=await page.evaluate(async definition=>{
   const [kind,type,heroes,health]=definition;
   const scenario=(type,heroes,health)=>({version:1,battleId:701,stacks:[{id:0,side:0,unit:type,count:1,heroes,health,damageMin:1,damageMax:1,attack:0,defense:0,speed:8,shooter:[0,32,38,66].includes(type)},{id:1,side:1,unit:37,count:1,heroes:true,health:10000,damageMin:0,damageMax:0,attack:0,defense:0,speed:1,shooter:false}]});
   await openbwLaunchCrossover(scenario(type,heroes,health));const api=openbwCrossover,x=movementEngine;api.pause();
   const plan=scenario(type,heroes,health);
   const apply=scale=>api.applyMagic(plan.stacks.map(row=>{const unit=api.census().units.find(u=>u.stackId===row.id);return {id:row.id,side:row.side,owner:row.side,count:1,hp:unit.hp+(unit.maxShields?unit.shields:0),maxHp:row.health,attack:0,defense:0,damageMin:row.damageMin,damageMax:row.damageMax,speed:row.speed,movementScale:row.id===0?scale:1000,shooter:row.shooter,x:0,y:0,disabled:row.id===1,berserk:false,cloned:false,moved:false,meleeReduction:0,rangedReduction:0,fireShield:0,healthDelta:0,revived:0,removed:false,creature:row.heroes?'core:archer':'heroes-starcraft:'+kind.toLowerCase(),luck:0,morale:0,retaliations:0};}));
   apply(1000);const camera=api.camera(),start=api.census().units.find(u=>u.stackId===0);api.order(0,start.x-camera.x<400?740:60,start.y-camera.y,false);
   for(let i=0;i<8;i++)x.openbw_step();
   const measure=scale=>{
    apply(scale);const before=api.census().units.find(u=>u.stackId===0);
    for(let i=0;i<24;i++)x.openbw_step();
    const after=api.census().units.find(u=>u.stackId===0);
    if(after.hp!==before.hp)throw Error('movement trial unexpectedly received damage');
    return Math.hypot(after.x-before.x,after.y-before.y);
   };
   const trials=[{kind,normal:measure(1000),haste:measure(1500),slow:measure(500),restored:measure(1000)}];
   return {trials,viewport:api.census().view};
  },definition);
  for(const row of results.trials){console.log(name,row);assert(row.normal>10,row.kind+' actually walks');assert(row.haste>row.normal*1.2,row.kind+' Haste increases real distance');assert(row.slow<row.normal*.8,row.kind+' Slow decreases real distance');assert(Math.abs(row.restored-row.normal)<10,row.kind+' removing the effect restores native speed');}
  assert(results.viewport.width<=320);assert(results.viewport.height<=240);await page.close();
  }
 } finally {await browser.close();}
}

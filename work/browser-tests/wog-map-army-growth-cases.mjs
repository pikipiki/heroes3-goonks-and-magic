import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
function program(){
 const n=number=>({kind:'number',access:'read',number});
 const v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access});
 const command=(receiver,selectors,code,args)=>({receiver,selectors,conditions:[],operations:[{code,args}]});
 const query=day=>[command('HE',[n(1)],'C',[n(0),n(0),v(51,'write'),v(50,'write')]),command('HE',[n(0)],'C',[n(0),n(0),v(53,'write'),v(52,'write')]),
  command('IF',[],'M',[{kind:'string',access:'read',text:`GROWTH${day} %V50/%V52`}])];
 const result={originalMessages:['ZVSE private native companion town continuation'],initializers:query(1),blocks:[2,3].map(day=>({kind:'trigger',receiver:'GE',selectors:[n(day)],conditions:[],commands:query(day)}))};
 result.sha256=createHash('sha256').update(JSON.stringify(result)).digest('hex');return result;
}
export async function runArmyGrowth({boot,sheet,state,command,wait,approachEnemy,resolve,page,report,output,save}){
 const scriptProgram=program();fs.writeFileSync(path.join(output,'growth-program.json'),JSON.stringify(scriptProgram,null,2));
 const grow=q=>q>=100000?q:Math.min(100000,Math.trunc(q*104/100));
 const readArmy=async()=>{const hero=await sheet(),s=await state(),army=s.armies.find(army=>army.id===hero.id);assert(army);const slots=structuredClone(army.slots);if(process.env.GROWTH_VERIFY_STATS){assert(s.troopEquipment?.troops);for(let slot=0;slot<slots.length;++slot)if(slots[slot]){const native=s.troopEquipment.troops.find(unit=>unit.slot===slot);assert(native);slots[slot].effectiveDefense=native.defense;}}await command(63);await wait(()=>goonkMobileState.mode==='map');return slots;};
 const pool=async(day,expected)=>{
  await wait(day=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.includes('GROWTH'+day)),day);
  const lines=(await state()).dialogPresentation.lines.join(' '),match=lines.match(new RegExp('GROWTH'+day+' (\\d+)/(\\d+)'));assert(match,lines);
  assert.deepEqual(match.slice(1).map(Number),expected,'Unplaced Valeska and stationary AI Orrin grow once per global day');
  await command(1);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 };
 if(process.env.GROWTH_OLD_SAVE){
  assert(process.env.GROWTH_OLD_REPORT);
  const original=JSON.parse(fs.readFileSync(process.env.GROWTH_OLD_REPORT,'utf8')).scenarios[0];
  const bytes=fs.readFileSync(process.env.GROWTH_OLD_SAVE);
  await boot({enabled:false,scriptProgram,growthChoice:1,growthConfigured:false,save:[...bytes]});
  assert.equal((await state()).day,2);
  const restored=await readArmy();assert.deepEqual(restored.map(u=>[u.count,u.experience,u.experiencePerUnit]),original.day2.map(row=>row.slice(0,3)));
  await command(3);await pool(3,[108,54]);const advanced=await readArmy();
  for(let slot=0;slot<7;++slot){assert.equal(advanced[slot].count,grow(restored[slot].count));assert.equal(advanced[slot].experience,restored[slot].experience);}
  report.scenarios.push('previous-fourteen-choice-save-preserves-applied-growth-and-continues-on-next-day');
  await page().close();return;
 }
 const combos=process.env.GROWTH_CHOICE!==undefined?[[Number(process.env.GROWTH_CHOICE),process.env.GROWTH_CONFIGURED==='1']]:[[1,false],[0,true],[-1,true],[-1,false]];
 for(const [growthChoice,growthConfigured] of combos){
  const active=growthChoice<0?growthConfigured:growthChoice===1;
  const options={enabled:false,growthFixture:true,scriptTown:true,enemyHero:true,scriptProgram,growthChoice,growthConfigured};
  await boot({...options,expectedDialog:'source-campaign'});await pool(1,[100,50]);
  await approachEnemy();await wait(()=>goonkMobileState.mode==='battle');await command(15);await resolve();
  const before=await readArmy();assert.equal(before.length,7);assert(before.every(unit=>unit&&unit.experience>0),'Actual native battle seeds nonzero total troop XP');
  const rankWitness=before.findIndex(unit=>unit.key==='core:pikeman');assert(before[rankWitness].experienceRank>0,'Real battle reaches a Pikeman rank threshold');
  await command(3);await pool(2,active?[104,52]:[100,50]);
  const day2=await readArmy();
  for(let slot=0;slot<7;++slot){assert.equal(day2[slot].count,active?grow(before[slot].count):before[slot].count);assert.equal(day2[slot].experience,before[slot].experience,'Growth preserves total XP');assert.equal(day2[slot].experiencePerUnit,Math.trunc(before[slot].experience/day2[slot].count));}
  if(active)assert(day2[rankWitness].experienceRank<before[rankWitness].experienceRank,'XP dilution removes the previous rank after growth');
  const rankBonusChange=process.env.GROWTH_VERIFY_STATS?{before:{rank:before[rankWitness].experienceRank,defense:before[rankWitness].effectiveDefense},after:{rank:day2[rankWitness].experienceRank,defense:day2[rankWitness].effectiveDefense}}:undefined;
  if(active&&rankBonusChange)assert(day2[rankWitness].effectiveDefense<before[rankWitness].effectiveDefense,'The lost rank removes its native defense bonus');
  const bytes=await save();fs.writeFileSync(path.join(output,`growth-${growthChoice}-${growthConfigured}.vsgm1`),Buffer.from(bytes));
  await page().close();await boot({...options,growthConfigured:!growthConfigured,save:[...bytes]});
  const restored=await readArmy();assert.deepEqual(restored.map(u=>[u.count,u.experience,u.experiencePerUnit,u.experienceRank]),day2.map(u=>[u.count,u.experience,u.experiencePerUnit,u.experienceRank]),'Reload must not reapply the saved growth transaction');
  await command(3);await pool(3,active?[108,54]:[100,50]);const day3=await readArmy();
  for(let slot=0;slot<7;++slot){assert.equal(day3[slot].count,active?grow(day2[slot].count):day2[slot].count);assert.equal(day3[slot].experience,before[slot].experience);}
  report.scenarios.push({growthChoice,growthConfigured,active,before:before.map(u=>[u.key,u.count,u.experience,u.experienceRank]),day2:day2.map(u=>[u.count,u.experience,u.experiencePerUnit,u.experienceRank]),day3:day3.map(u=>[u.count,u.experience,u.experiencePerUnit,u.experienceRank]),pooledHero:true,aiHero:true,nativeSaveReload:true,rankBonusChange,input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
  await page().close();
 }
}

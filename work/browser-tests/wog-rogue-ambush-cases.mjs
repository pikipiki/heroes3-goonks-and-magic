import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {nativeJsonSubtree} from './native-save-json-proof.mjs';

function fields(node,names){
 assert.equal(node.type,5);assert.equal(node.value.length,names.length);
 const result={};
 for(const[index,name]of [...names].sort().entries()){
  const row=node.value[index];
  // Attribute an opaque key by the verified C++ schema order. Never resolve
  // an external interned string or invent its literal contents.
  if(typeof row.key==='string')assert.equal(row.key,name);else assert(Number.isInteger(row.key.externalStringReference));
  result[name]=row.node;
 }
 return result;
}
function snapshot(bytes,stage){
 const raw=nativeJsonSubtree(bytes,'rogues');const hasDate=raw.node.value.length===5;
 const root=fields(raw.node,raw.node.value.length===1?['timer']:raw.node.value.length===2?['flag875','timer']:hasDate?['flag875','lastDates','pending','sequence','timer']:['flag875','pending','sequence','timer']);
 const timer=fields(root.timer,['owner','human','day','week']);
 const jobs=(root.pending?.value||[]).map(row=>{
  const base=['actualEntry','controller','day','hero','heroName','human','object','phase','timerOwner','token','water','week','x','y','z'];
  if(stage==='reward')base.push('army','count','creature','gold','goldGranted');
  const values=fields(row.node,base);return Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.value]));
 });
 return {stage,flag875:root.flag875?.value??false,sequence:root.sequence?.value??0,timer:Object.fromEntries(Object.entries(timer).map(([k,v])=>[k,v.value])),dates:hasDate?root.lastDates.value.map(row=>({ownerKey:row.key,day:row.node.value})):[],jobs,externalStringsRemainOpaque:true,schemaOrderedFields:true,raw};
}
function program(){
 const source=`ZVSE
!#HE6:W1000000;
!$OB79;
!!HE-1:P?v810/?v811/?v812;
!!SN:W^wog_127_lastRogueDate_0^/?v813;
!!IF&875:M^ROGUE_POST %V810/%V811 DATE %V813 FLAG 1^;
!!IF&-875:M^ROGUE_POST %V810/%V811 DATE %V813 FLAG 0^;
!$OB29;
!!HE-1:P?v810/?v811/?v812;
!!SN:W^wog_127_lastRogueDate_0^/?v813;
!!IF&875:M^ROGUE_POST %V810/%V811 DATE %V813 FLAG 1^;
!!IF&-875:M^ROGUE_POST %V810/%V811 DATE %V813 FLAG 0^;`;
 const aiWitness=process.env.ROGUE_AI==='1'?`
!?BA0;
!!VRv820:S0;
${Array.from({length:7},(_,slot)=>`!!BA:M1/${slot}/?v821/?v822;\n!!VRv820:+v822;`).join('\n')}
!!BA:M1/0/?v821/?v822;
!!SN:W^rogueAiType^/v821;
!!SN:W^rogueAiCount^/v820;
!$OB98;
!!SN:W^rogueAiType^/?v821;
!!SN:W^rogueAiCount^/?v820;
!!IF:M^ROGUE_AI_WITNESS %V821/%V820^;`:'';
 const p=compileErm(Buffer.from(source+aiWitness),{source:'Private native source127 seed, resource visits and post-visit witness'});
 p.originalMessages=['ZVSE private native companion town continuation'];return p;
}
export async function runRogueAmbush({boot,sheet,state,command,wait,page,report,output,save}){
 const water=process.env.ROGUE_WATER==='1',defeat=process.env.ROGUE_DEFEAT==='1',desktop=process.env.GROWTH_DESKTOP==='1';
 const choice=Number(process.env.ROGUE_CHOICE??1),configured=process.env.ROGUE_CONFIGURED==='1';
 const ai=process.env.ROGUE_AI==='1';
 const fixture={water,defeat,ai,weakArmy:true,sites:Number(process.env.ROGUE_SITES??112),seed:Number(process.env.ROGUE_SEED??1)};
 const producer=process.env.ROGUE_LEGACY_PRODUCER==='1',legacy=process.env.ROGUE_LEGACY_SAVE;
 const opts={enabled:false,enemyHero:ai,scriptTown:true,scriptProgram:program(),rogueFixture:fixture,rogueChoice:producer?null:choice,rogueConfigured:configured,heroLevelLimit:1,...(!desktop?{viewport:{width:390,height:844}}:{})};
 const active=legacy?false:choice<0?configured:choice===1;
 fs.writeFileSync(path.join(output,'rogue-program.json'),JSON.stringify(opts.scriptProgram,null,2));
 await boot({...opts,...(legacy?{save:[...fs.readFileSync(legacy)]}:{})});
 if(producer){
  const bytes=await save();fs.writeFileSync(path.join(output,'legacy939.vsgm1'),bytes);
  report.scenarios.push({legacyProducer:true,saveVersion:bytes.readInt32LE(4)});await page().close();return;
 }
 if(ai){
  const days=[];
  for(let day=2;day<=6;++day){
   await command(3);await wait(d=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day===d,day);
   const bytes=await save();fs.writeFileSync(path.join(output,'ai-day-'+day+'.vsgm1'),bytes);
   const proof=snapshot(bytes,'complete');days.push(proof);
   if(proof.dates.some(row=>row.day>0)){
    assert.equal(proof.jobs.length,0);assert.equal(typeof proof.flag875,'boolean');
    await visit({x:9,y:9});let witness;
    for(let tick=0;tick<100;++tick){
     const current=await state();if(current.mode==='dialog'){
      const message=(current.dialogPresentation?.lines||[]).join(' '),match=message.match(/ROGUE_AI_WITNESS\s+(\d+)\/(\d+)/);
      if(match)witness={creature:Number(match[1]),count:Number(match[2])};await command(1);
     }else if((current.mode==='map'||current.mode==='town')&&!current.hasPath&&!current.heroMoving&&witness)break;
     await page().waitForTimeout(100);
    }
    assert.deepEqual(witness,{creature:0,count:20});
    const log=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));fs.writeFileSync(path.join(output,'native-packets.log'),log);
    report.scenarios.push({active,ai,seed:fixture.seed,days,witness});await page().close();return;
   }
  }
  throw Error('Seeded AI visits did not produce an ambush');
 }
 let position={x:8,y:water?12:11};let encounter=null;const posts=[];
 const press=async()=>{
  const before=(await state()).dialogPresentation?.queryId;
  await page().locator('[data-dialog-confirm]')[desktop?'click':'tap']();
  await wait(id=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==id,before);
 };
 const text=s=>(s.dialogPresentation?.lines||[]).join('\n');
 async function visit(target){
  let view;
  for(let attempt=0;attempt<30;++attempt){
   const map=(await state()).mapOverview;
   await page().evaluate(point=>Module._vcmiMobilePointer(point.x,point.y,5),{x:Math.round(map.rect.x+target.x*map.rect.w/map.width),y:Math.round(map.rect.y+target.y*map.rect.h/map.height)});
   await page().waitForTimeout(150);
   const current=(await state()).mapOverview;
   if(current.viewport.x===Math.floor(target.x+.5-Math.floor(current.view.w/2)/32)&&current.viewport.y===Math.floor(target.y+.5-Math.floor(current.view.h/2)/32)){view=current.view;break;}
  }
  assert(view,'Native minimap camera reached target');
  await page().evaluate(view=>Module._vcmiMobilePointer(view.x+Math.floor(view.w/2),view.y+Math.floor(view.h/2),1),view);
  await wait(()=>goonkMobileState.hasPath);await command(2);
 }
 async function settle({stopAtWarning=false,stopAtReward=false}={}){
  for(let tick=0;tick<900;++tick){
   const current=await state(),copy=text(current);
   if(current.mode==='dialog'){
    if(/ambush|embuscade|becomes alive|s’animent/i.test(copy)){
     if(stopAtWarning)return {kind:'warning',current};
     throw Error('Unexpected additional ambush: '+copy);
    }
    if(/Rogues had treasure|Brigands possédaient/i.test(copy)){
     if(stopAtReward)return {kind:'reward',current};
     throw Error('Unexpected duplicate rogue gold message');
    }
    const post=copy.match(/ROGUE_POST\s+(\d+)\/(\d+)\s+DATE\s+(\d+)\s+FLAG\s+(\d)/);
    if(post){position={x:Number(post[1]),y:Number(post[2])};posts.push({...position,date:Number(post[3]),flag:Number(post[4])});assert.equal(Number(post[4]),0);await press();}
    else if(current.dialogKind==='commander-level-up'){
     const option=current.dialogPresentation?.choices?.find(c=>c.selectable&&Number.isInteger(c.skillId));
     if(option)await command(96,option.skillId);await command(1);
    }else await command(1);
   }else if(current.mode==='battle'){
    if(!encounter?.units){await command(15);await wait(()=>goonkMobileState.battleUnits?.some(u=>u.enemy));encounter.units=(await state()).battleUnits.filter(u=>u.enemy&&u.armySlot>=0);}
    if(current.canAutoCombat&&!current.autoCombat)await command(44,1);
   }else if(current.mode==='map'&&!current.hasPath&&!current.heroMoving){await page().waitForTimeout(250);if((await state()).mode==='map')return{kind:'map',current:await state()};}
   await page().waitForTimeout(70);
  }
  throw Error('Native rogue visit did not settle');
 }
 for(let index=0;index<fixture.sites;++index){
  const row=Math.floor(index/14),column=index%14;
  const target={x:9+(row%2?13-column:column),y:(water?14:12)+row*(water?1:2)};
  await visit(target);const result=await settle({stopAtWarning:true});
  if(result.kind==='warning'){
   encounter={index,target,beforeGold:result.current.resources[6]};assert(active);
   const bytes=await save();fs.writeFileSync(path.join(output,'warning.vsgm1'),bytes);encounter.warning=snapshot(bytes,'warning');
   assert.equal(encounter.warning.flag875,false);assert.deepEqual(encounter.warning.dates,[]);assert.equal(encounter.warning.jobs.length,1);
   fs.writeFileSync(path.join(output,'encounter-warning.json'),JSON.stringify(encounter,null,2));
   await page().screenshot({path:path.join(output,water?'water-warning.png':'land-warning.png')});
   await page().close();await boot({...opts,save:[...bytes],expectedDialog:'any'});
   assert.match(text(await state()),/ambush|embuscade|becomes alive|s’animent/i);
   await press();
   const finished=await settle({stopAtReward:!water&&!defeat});
   if(!water&&!defeat){
    assert.equal(finished.kind,'reward');assert.equal(finished.current.resources[6]-encounter.beforeGold,500);
    const reward=await save();fs.writeFileSync(path.join(output,'reward.vsgm1'),reward);encounter.reward=snapshot(reward,'reward');
    assert.equal(encounter.reward.flag875,true);assert.deepEqual(encounter.reward.dates,[]);
    assert.equal(encounter.reward.jobs[0].count,20);assert.equal(encounter.reward.jobs[0].creature,143);assert.equal(encounter.reward.jobs[0].gold,500);
    await page().close();await boot({...opts,save:[...reward],expectedDialog:'any'});assert.equal((await state()).resources[6],finished.current.resources[6]);
    assert.match(text(await state()),/Rogues had treasure|Brigands possédaient/i);await press();await settle();
   }
   const completed=await save();fs.writeFileSync(path.join(output,'completed.vsgm1'),completed);encounter.completed=snapshot(completed,'complete');
   assert.equal(encounter.completed.flag875,defeat);assert.equal(encounter.completed.jobs.length,0);assert.equal(encounter.completed.dates.length,1);assert.equal(encounter.completed.dates[0].day,1);
   assert.equal(encounter.units.reduce((n,u)=>n+u.count,0),20);assert(encounter.units.every(u=>u.key===(water?'core:waterElemental':'core:rogue')||water&&u.key==='core:iceElemental'));
   if(!defeat){
    encounter.cooldownVisits=[];
    for(let next=index+1;next<Math.min(index+4,fixture.sites);++next){
     const r=Math.floor(next/14),c=next%14;
     const site={x:9+(r%2?13-c:c),y:(water?14:12)+r*(water?1:2)};
     await visit(site);assert.equal((await settle()).kind,'map');encounter.cooldownVisits.push(site);
    }
    const cooldown=await save();fs.writeFileSync(path.join(output,'cooldown.vsgm1'),cooldown);encounter.cooldown=snapshot(cooldown,'complete');
    assert.equal(encounter.cooldown.sequence,encounter.completed.sequence);
    assert.deepEqual(encounter.cooldown.dates,encounter.completed.dates);
    assert.equal(encounter.cooldown.jobs.length,0);
   }
   break;
  }
  if(!active&&index>=2)break;
 }
 if(active)assert(encounter,'Seeded adventure must produce an actual native ambush');else assert.equal(encounter,null);
 const log=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));fs.writeFileSync(path.join(output,'native-packets.log'),log);
 report.scenarios.push({active,water,defeat,desktop,seed:fixture.seed,posts,encounter});
 await page().close();
}

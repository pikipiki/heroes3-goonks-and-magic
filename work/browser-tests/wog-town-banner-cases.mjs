import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {nativeJsonSubtree,nativeJsonField,nativeBannerRecords} from './native-save-json-proof.mjs';
export async function runTownBanners({boot,sheet,state,command,wait,resolve,page,report,output,readCompletedNativeSave}){
 const currentVersion=Number(process.env.GOONK_EXPECTED_SAVE_VERSION||938),historical=process.env.BANNER_OLD_CONTROL==='1',legacy=process.env.BANNER_LEGACY_SAVE;
 const difficulty=Number(process.env.BANNER_DIFFICULTY??0),choice=Number(process.env.BANNER_CHOICE??1),configured=process.env.BANNER_CONFIGURED==='1',banned=process.env.BANNER_BANNED==='1';
 const growth=process.env.BANNER_GROWTH==='1',catalog=process.env.BANNER_CATALOG==='1',blocked=Number(process.env.BANNER_BLOCKED??0);
 const active=!historical&&!legacy&&(choice<0?configured:choice===1)&&!banned;
 const fight=process.env.BANNER_FIGHT==='1';
 const fixture={configured,banned,growth,catalog,blocked,fight};
 const opts={enabled:false,townBannerChoice:historical?null:choice,townBannerFixture:fixture,growthChoice:0,archangels:100,difficulty,settings:{ai:{adventureEnemyAI:'EmptyAI',adventureAlliedAI:'EmptyAI'}},...(process.env.GROWTH_DESKTOP==='1'?{}:{viewport:{width:390,height:844}})};
 const sourceOptions=process.env.BANNER_SOURCE_OPTIONS==='1';
 if(sourceOptions){opts.scriptTown=true;const program=compileErm(Buffer.from('ZVSE\n!#UN:P239/?v8200 P234/?v8201;\n!#IF:M^BANNER FLAGS %V8200 %V8201^;'),{source:'Private source239/234 frozen option witnesses'});program.originalMessages=['ZVSE private native companion town continuation'];opts.scriptProgram=program;opts.expectedDialog='source-campaign';fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));}
 const save=async(label)=>{const bytes=await readCompletedNativeSave(page(),command);assert.equal(bytes.readInt32LE(4),currentVersion);fs.writeFileSync(path.join(output,label+'.vsgm1'),bytes);return bytes;};
 await boot(legacy?{...opts,save:[...fs.readFileSync(legacy)]}:opts);
 if(sourceOptions){await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(l=>l.startsWith('BANNER FLAGS ')));assert((await state()).dialogPresentation.lines.includes(`BANNER FLAGS ${+active} ${+banned}`));await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);}
 let bytes=await save('day1'),records=[];
 if(active){
  records=nativeBannerRecords(bytes);const expected=catalog?10:growth?3:blocked===3?1:2;
  assert.equal(records.length,expected);assert(records.every(r=>r.count===1));
  assert.equal(records.filter(r=>r.enabled).length,catalog?4:growth?1:fight?1:0);
  assert.equal(nativeJsonField(nativeJsonSubtree(bytes,'mapRules').node,'bannersPlaced').value,true);
 }else assert(!nativeJsonSubtree(bytes,'mapRules').node.value.some(row=>row.key==='bannerGuards'));
 await page().close();await boot({...opts,townBannerFixture:{...fixture,configured:!configured,banned:!banned},save:[...bytes]});
 const restored=await save('day1-reloaded');if(active)assert.deepEqual(nativeBannerRecords(restored),records);
 let pickup=null;
 if((process.env.BANNER_PICKUP==='1'||fight)&&active&&blocked<3){
  const press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
  let hero=await sheet();assert(![...hero.slots,...hero.backpack].some(s=>/Banner|Bannière/i.test(s.name||'')));await command(63);await wait(()=>goonkMobileState.mode==='map');
  await page().mouse.move(400,300);await command(6);await page().waitForTimeout(150);
  const targetX=blocked===0?8:blocked===1?9:7;
  await page().evaluate(x=>{const m=goonkMobileState.mapOverview,v=m.view;Module._vcmiMobilePointer(v.x+(x-m.viewport.x+.5)*32,v.y+v.h/2-32,1);},targetX);
  await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='dialog'||goonkMobileState.mode==='battle');
  let battle=null;
  if(fight){
   if((await state()).mode==='dialog')await page().locator('[data-dialog-confirm]')[press]();
   await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);
   const enemies=(await state()).battleUnits.filter(u=>u.enemy);assert.equal(enemies.length,1);assert.equal(enemies[0].count,1);
   const expected=['core:champion','core:cavalier','core:archangel','wake-of-gods.level8units:supremeArchangel','wake-of-gods.level8units:supremeArchangel'][difficulty];assert.equal(enemies[0].key,expected);
   battle={guardian:enemies[0].key,count:enemies[0].count};await page().screenshot({path:path.join(output,'guard-battle-'+press+'.png')});await command(15);await resolve();
  }else assert.notEqual((await state()).mode,'battle','An owned-town banner initially has inactive guardians');
  await page().waitForTimeout(500);
  await page().screenshot({path:path.join(output,'pickup-'+press+'.png')});
  if((await state()).mode==='dialog'){const confirm=page().locator('[data-dialog-confirm]');if(await confirm.isVisible())await confirm[press]();else await page().locator('[data-ui-header-close="true"]')[press]();}
  await wait(()=>goonkMobileState.mode==='map');hero=await sheet();const artifacts=[...hero.slots,...hero.backpack].filter(s=>/Banner|Bannière/i.test(s.name||''));assert.equal(artifacts.length,1);
  pickup={targetX,artifacts,input:press==='tap'?'touch':'mouse',inactiveGuardDidNotFight:!fight,battle};await command(63);await wait(()=>goonkMobileState.mode==='map');
  bytes=await save('picked-up');await page().close();await boot({...opts,save:[...bytes]});const loaded=await sheet();assert.equal([...loaded.slots,...loaded.backpack].filter(s=>/Banner|Bannière/i.test(s.name||'')).length,1);await command(63);await wait(()=>goonkMobileState.mode==='map');
 }
 const days=[];
 if(growth&&active){
  let day=1;
  for(const target of [8,15,22,29]){
   while(day<target){
    await command(3);const expectedDay=day+1;
    for(let poll=0;poll<600;++poll){
     const current=await state();if(current.day===expectedDay&&current.mode==='map'&&current.turn)break;
     if(current.mode==='dialog')await command(1);
     if(poll===599)throw Error('Native day did not advance to '+expectedDay+' '+JSON.stringify({day:current.day,mode:current.mode,turn:current.turn,dialog:current.dialogPresentation}));
     await page().waitForTimeout(100);
    }
    day=expectedDay;
   }
   bytes=await save('day'+target);const now=nativeBannerRecords(bytes);
   const expected=target<15?1:target<29?(difficulty%2===0?2:1):(difficulty%2===0?3:2);
   assert(now.every(r=>r.count===expected));assert.equal(now.filter(r=>r.enabled).length,target>=29||target>=15&&difficulty%2===0?3:1);
   assert.equal((await state()).day,target);days.push({day:target,count:expected,enabled:now.filter(r=>r.enabled).length});
   await page().close();await boot({...opts,townBannerFixture:{...fixture,configured:false,banned:true},save:[...bytes]});
   assert.deepEqual(nativeBannerRecords(await save('day'+target+'-reloaded')),now);
  }
 }
 report.scenarios.push({active,choice,configured,banned,difficulty,catalog,blocked,growth,fight,sourceOptions,records,days,pickup,saveVersion:currentVersion,legacyInput:legacy?937:null,historicalNativeControl:historical,day1SaveReload:true,frozenRuleSurvivesReversedDefaults:true,externalStringReferencesRemainOpaque:true});
 await page().close();
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {convertObjectTemplate,parseDwellingTable,compileDwelling,parseReplacementScript,executeReplacementPlan,validateReplacementPlans} from '../scripts/era-bridge/objects/objects.mjs';
const fixture=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/tum/'+name,import.meta.url)));
const line='TEST.def 001111111111111111111111111111111111111111111111 100000000000000000000000000000000000000000000000 111111111 011111111 17 101 0 1';
test('H3 bit0 is native bottom-right; MSK crops preserved original cells',()=>{
 let x=convertObjectTemplate(line,{maskBytes:Uint8Array.from([3,2])});
 assert.deepEqual(x.template.mask,['VVV','VBA']);assert.equal(x.template.zIndex,100);assert.deepEqual(x.template.visitableFrom,['---','+-+','+++']);assert.equal(x.template.allowedTerrains,undefined);
 assert.deepEqual(convertObjectTemplate(line.replace(' 011111111 ',' 100000000 ')).template.allowedTerrains,['water']);
 assert.deepEqual(convertObjectTemplate(line.replace(' 011111111 ',' 001000000 ')).template.allowedTerrains,['subterra'],'H3 terrain bit6 resolves the native terrain, not the subterranean battlefield');
});
test('all 677 original templates compile, have assets dimensions and retain IDs',()=>{const rows=fixture('templates.json');assert.equal(rows.length,677);assert.ok(rows.every(x=>!x.error&&x.source.mskApplied&&x.template.mask.length===x.source.height));assert.ok(rows.every(x=>x.template.mask.every(y=>y.length===x.source.width)));});
test('rejects unsupported or malformed masks and MSK',()=>{assert.throws(()=>convertObjectTemplate(line.replace('00111111','11111111')),e=>e.code==='UNREPRESENTABLE_MASK');assert.throws(()=>convertObjectTemplate('x'),e=>e.code==='INVALID_TEMPLATE');assert.throws(()=>convertObjectTemplate(line,{maskBytes:new Uint8Array([9,6])}),e=>e.code==='INVALID_INTEGER');});
test('original dwelling roster uses subtype row, explicit creature and guards mapping',()=>{
 const rows=fixture('dwellings.json');assert.equal(rows.filter(r=>r.objectType===17).length,167);assert.equal(rows.filter(r=>r.objectType===20).length,5);
 const row=rows.find(r=>r.objectType===17&&r.objectSubtype===84);assert.deepEqual(row.creatureIds,[224]);
 const lab=rows.find(r=>r.objectType===20&&r.objectSubtype===3);assert.deepEqual(lab.creatureIds,[224,154,69,68]);
 const opts={templates:{base:convertObjectTemplate(line).template},resolveCreature:id=>'test:creature'+id,guards:[{creatureId:224,amount:3}]};
 const built=compileDwelling(lab,opts).definition['core:creatureGeneratorSpecial'].types.dwelling3;
 assert.deepEqual(built.creatures,[['test:creature224'],['test:creature154'],['test:creature69'],['test:creature68']]);assert.deepEqual(built.guards,[{type:'test:creature224',amount:3}]);
 assert.throws(()=>compileDwelling(row,{...opts,guards:undefined}),e=>e.code==='UNVERIFIED_GUARDS');assert.throws(()=>compileDwelling(row,{...opts,resolveCreature:()=>undefined}),e=>e.code==='UNRESOLVED_ID');
});
test('dwelling table reader rejects shifted row content',()=>{assert.throws(()=>parseDwellingTable('bad'),e=>e.code==='INVALID_DWELLING_TABLE');assert.throws(()=>parseDwellingTable('TYPE 17 (one creature)\nA\tbad\t0\tD\t-1\t-1\t-1\t-1'),e=>e.code==='INVALID_DWELLING_TABLE');});
test('all original replacement parameter slots enumerated, exceptional triggers and collision retained',()=>{
 const plans=fixture('replacements.json');assert.equal(plans.length,102);assert.equal(plans.flatMap(p=>p.rules).filter(r=>r.enabled).length,110);assert.equal(plans.filter(p=>p.conditions.randomMap===null).length,4);
 assert.throws(()=>validateReplacementPlans(plans),e=>e.code==='COLLIDING_REPLACER_IDS'&&e.details.id==='143');
 const azure=plans.find(p=>p.id==='173');assert.deepEqual(azure.rules[0],{slot:0,sourceType:17,sourceSubtype:62,percentage:50,xOffset:1,enabled:true});
});
test('replacer interpreter consumes RNG on wrong subtypes, checks bounds after draw, and applies slots sequentially',()=>{
 const objects=[{type:17,subtype:62,position:{x:1,y:2,z:0}},{type:17,subtype:99,position:{x:3,y:2,z:0}},{type:17,subtype:62,position:{x:4,y:2,z:0}}];
 let draws=0,cursor=-1;const changes=[];const adapter={width:5,countType:t=>objects.filter(o=>o.type===t).length,resetSearch:()=>{cursor=-1;},findNextType:()=>objects[++cursor],setSearchPosition:()=>{},randomInt:()=>{draws++;return 49;},getObject:o=>o,replaceObject:(o,n)=>{changes.push(n);Object.assign(o,n);}};
 const p=structuredClone(fixture('replacements.json').find(x=>x.id==='173'));
 assert.deepEqual(executeReplacementPlan([p],adapter,{day:2,firstPlayer:true,randomMap:false,enabled:true}),{replaced:0,draws:0});
 assert.deepEqual(executeReplacementPlan([p],adapter,{day:1,firstPlayer:true,randomMap:true,enabled:true}),{replaced:0,draws:0});
 assert.deepEqual(executeReplacementPlan([p],adapter,{day:1,firstPlayer:true,randomMap:false,enabled:true}),{replaced:1,draws:3});assert.equal(draws,3);assert.equal(changes[0].position.x,2);assert.equal(changes[0].flag,'CB_173_Set_Flag_2_2_0');
});
test('probability85/76 fixtures remain unmodified until executable semantics are verified',()=>{const rows=fixture('bank-probabilities.json');assert.equal(rows.filter(x=>x.totalChance===85).length,6);assert.equal(rows.filter(x=>x.totalChance===76).length,1);});
test('template catalog emits native merge patches only with explicit object identities',async()=>{
 const {compileTemplateCatalog}=await import('../scripts/era-bridge/objects/objects.mjs');const rows=fixture('templates.json');
 const result=compileTemplateCatalog(rows,{resolveObject:(type,subtype)=>({group:`test:object${type}`,type:`subtype${subtype}`})});
 assert.equal(Object.values(result.definition).flatMap(g=>Object.values(g.types)).reduce((n,t)=>n+Object.keys(t.templates).length,0),677);
 assert.ok(result.assets.length>600);assert.throws(()=>compileTemplateCatalog(rows,{resolveObject:()=>null}),e=>e.code==='UNRESOLVED_OBJECT');
});
test('verified ERA dwelling guards independently check each slot level and growth',async()=>{
 const {eraDwellingGuards}=await import('../scripts/era-bridge/objects/objects.mjs');const row={creatureIds:[1,2,3,4]};
 const stats={1:{level:4,growth:10},2:{level:5,growth:3},3:{level:7,growth:1},4:{level:8,growth:0}};
 assert.deepEqual(eraDwellingGuards(row,{resolveStats:id=>stats[id],levelBase:1}),[{creatureId:2,amount:9},{creatureId:3,amount:3}]);
 assert.deepEqual(eraDwellingGuards(row,{resolveStats:id=>({...stats[id],level:stats[id].level-1}),levelBase:0}),[{creatureId:2,amount:9},{creatureId:3,amount:3}]);
 assert.throws(()=>eraDwellingGuards(row,{resolveStats:()=>null,levelBase:1}),e=>e.code==='UNRESOLVED_STATS');
});
test('ERA bank remainder mode uses first three chances, never normalizes fourth',async()=>{
 const {compileTumBank}=await import('../scripts/era-bridge/banks.mjs');
 const state=chance=>({chance,guardians:{type:[1],count:[5]},resources:[0,0,0,0,0,0,0],creatureRewardType:-1,creatureRewardCount:0,artifactTypeCounts:[0,0,0,0]});
 const b={name:'Bank',states:[25,25,25,10].map(state)};
 const opts={objectId:'bank',nativeTemplates:{base:convertObjectTemplate(line).template},guardsLayout:'creatureBank',resolveCreature:id=>'test:c'+id};
 assert.throws(()=>compileTumBank(b,opts),e=>e.diagnostics.some(d=>d.code==='INVALID_WEIGHTS'));
 const result=compileTumBank(b,{...opts,chanceMode:'era-fourth-state-remainder'});
 assert.deepEqual(result.report.effectiveWeights,[25,25,25,25]);assert.equal(result.report.sourceWeightTotal,85);
 assert.deepEqual(result.definition['core:creatureBank'].types.bank.rewards.map(r=>r.appearChance),[{min:0,max:25},{min:25,max:50},{min:50,max:75},{min:75,max:100}]);
 const c={...b,states:[30,30,6,10].map(state)};assert.deepEqual(compileTumBank(c,{...opts,chanceMode:'era-fourth-state-remainder'}).report.effectiveWeights,[30,30,6,34]);
 assert.throws(()=>compileTumBank({...b,states:[state(30)]},{...opts,chanceMode:'era-fourth-state-remainder'}),e=>e.diagnostics.some(d=>d.code==='UNDECLARED_FALLBACK_STATE'));
});
test('real original importer produces full native dwelling/asset bundles and rejects unresolved banks atomically',{skip:!process.env.TUM_SOURCE},async()=>{
 const {prepareTumObjectImport}=await import('../scripts/era-bridge/objects/importer.mjs');
 const sourceRoot=process.env.TUM_SOURCE;
 const result=prepareTumObjectImport({sourceRoot,resolveCreature:id=>'fixture:c'+id,resolveStats:()=>({level:5,growth:3}),levelBase:1,resolveBankLayout:()=> 'creatureBankNarrow'});
 assert.equal(result.compiled.filter(x=>x.kind==='dwelling').length,69);assert.ok(result.compiled.some(x=>x.kind==='bank'));assert.equal(result.activation.enabled,false);
 assert.equal(result.compiled.length+result.diagnostics.length,103);
 for(const item of result.compiled){assert.ok(result.files.has(item.config));const config=JSON.parse(result.files.get(item.config));const t=Object.values(Object.values(config)[0].types)[0];for(const template of Object.values(t.templates)){assert.ok(result.files.has('content/sprites/'+template.animation));assert.ok(result.files.has('content/sprites/'+template.animation.replace(/\.[^.]+$/,'.msk')));}}
 const missing=prepareTumObjectImport({sourceRoot,resolveCreature:()=>null,resolveStats:()=>({level:5,growth:3}),levelBase:1,resolveBankLayout:()=> 'creatureBankNarrow'});assert.equal(missing.compiled.length,0);assert.equal(missing.files.size,0);assert.equal(missing.diagnostics.length,103);
});
test('real archived growth+source cfg levels compile66 new dwellings without synthetic statistics',{skip:!process.env.TUM_SOURCE},async()=>{
 const {prepareTumObjectImport}=await import('../scripts/era-bridge/objects/importer.mjs');const sourceRoot=process.env.TUM_SOURCE;
 const result=prepareTumObjectImport({sourceRoot,resolveCreature:id=>'fixture:c'+id,resolveBankLayout:()=> 'creatureBankNarrow'});
 assert.equal(result.compiled.filter(x=>x.kind==='dwelling').length,66);
 assert.deepEqual(result.diagnostics.filter(x=>x.kind==='dwelling').map(x=>x.id),['20_2','20_3','20_4']);
 const rider=JSON.parse(result.files.get('content/config/objects/dwelling17_101.json'))['core:creatureGeneratorCommon'].types.eraDwelling17_101;
 assert.equal(rider.guards[0].type,'fixture:c318');assert.ok(rider.guards[0].amount>0);
});
test('verified ERA upgrade mode targets only source slot0, clamps100 and rejects multiple native choices',async()=>{
 const {compileTumBank}=await import('../scripts/era-bridge/banks.mjs');
 const s={chance:100,upgrade:222,guardians:{type:[65,65,65,65,-1,-1,-1],count:[20,20,20,20,0,0,0]},resources:[0,0,0,0,0,0,100],creatureRewardType:-1,creatureRewardCount:0,artifactTypeCounts:[0,0,0,0]};
 const b={name:'Upgrade bank',states:[s]};
 const o={objectId:'bank',nativeTemplates:{base:convertObjectTemplate(line).template},guardsLayout:'creatureBankNarrow',resolveCreature:id=>'fixture:c'+id,chanceMode:'era-fourth-state-remainder',upgradeMode:'era-first-occupied-slot',resolveEraUpgrade:()=>({kind:'upgrade',eraId:222,evidence:'verified source getUpgrade mapping'}),resolveNativeUpgrades:()=>['fixture:c222']};
 const result=compileTumBank(b,o).definition['core:creatureBank'].types.bank.rewards[0];assert.equal(result.guards[0].upgradeChance,100);assert.ok(result.guards.slice(1).every(g=>g.upgradeChance===undefined));
 assert.throws(()=>compileTumBank(b,{...o,resolveNativeUpgrades:()=>['fixture:c66','fixture:c222']}),e=>e.diagnostics.some(d=>d.code==='NON_EQUIVALENT_NATIVE_UPGRADES'));
 assert.throws(()=>compileTumBank(b,{...o,resolveEraUpgrade:undefined}),e=>e.diagnostics.some(d=>d.code==='MISSING_UPGRADE_RESOLVER'));
 const no=compileTumBank(b,{...o,resolveEraUpgrade:()=>({kind:'none',evidence:'verified original has no applicable town upgrade'}),resolveNativeUpgrades:()=>[]});assert.ok(no.definition['core:creatureBank'].types.bank.rewards[0].guards.every(g=>g.upgradeChance===undefined));
});
test('original ERA single spell bitmasks compile exact catalog candidates, not unrelated mod spells',async()=>{
 const {compileEraSpellFilters}=await import('../scripts/era-bridge/objects/bank-extras.mjs');
 const spellCatalog=[{eraId:1,nativeId:'core:a',level:1,schoolBits:1,flags:1},{eraId:2,nativeId:'core:b',level:2,schoolBits:2,flags:1},{eraId:3,nativeId:'core:c',level:2,schoolBits:8,flags:4},{eraId:4,nativeId:'core:d',level:2,schoolBits:4,flags:0}];
 assert.deepEqual(compileEraSpellFilters([{bits:{levels:4}}],{spellCatalog}),[{anyOf:['core:b','core:c']}]);
 assert.deepEqual(compileEraSpellFilters([{bits:{levels:4,schools:2,flags:1}}],{spellCatalog}),[{anyOf:['core:b']}]);
 assert.deepEqual(compileEraSpellFilters([{id:-1,bits:{levels:4}}],{spellCatalog}),[]);
 assert.throws(()=>compileEraSpellFilters([{bits:{levels:4}},{bits:{levels:4}}],{spellCatalog}),e=>e.code==='UNSUPPORTED_SPELL_UNIQUENESS');
});
test('native bank layout preserves decimal07 and original fallback for out-of-board cells',async()=>{
 const {compileEraTroopPlacement}=await import('../scripts/era-bridge/objects/bank-extras.mjs');const baseLayout={attackerUnits:[57,61,90,93,96,125,129],defenderUnits:[15,185,172,2,100,87,8],attackerCommander:94,defenderCommander:8};
 const source={isBank:true,attackers:['86','89','92','53','56','121','124'],defenders:['15','185','100','11','181','07','177']};
 const r=compileEraTroopPlacement(source,{layoutId:'tumCastle',baseLayout});assert.deepEqual(r.layout.attackerUnits,[86,89,92,53,56,121,124]);assert.deepEqual(r.layout.defenderUnits,[15,185,100,11,181,7,177]);assert.equal(r.layout.obstaclesAllowed,false);assert.equal(r.layout.tacticsAllowed,false);
 const bad=structuredClone(source);bad.defenders[0]='0';bad.defenders[1]='16';assert.deepEqual(compileEraTroopPlacement(bad,{layoutId:'bad',baseLayout}).layout.defenderUnits.slice(0,2),[15,185]);
});
test('advanced real importer uses native Mithril dependency, original spell candidates and exact castle layouts',{skip:!process.env.TUM_SOURCE},async()=>{
 const {prepareTumObjectImport}=await import('../scripts/era-bridge/objects/importer.mjs');const sourceRoot=process.env.TUM_SOURCE;
 const baseLayout={attackerUnits:[57,61,90,93,96,125,129],defenderUnits:[15,185,172,2,100,87,8],attackerCommander:94,defenderCommander:8};
 const baseSound=process.env.TUM_BASE_SND||path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/Heroes3.snd');
 const r=prepareTumObjectImport({sourceRoot,baseSoundArchivePaths:fs.existsSync(baseSound)?[baseSound]:[],resolveCreature:id=>'fixture:c'+id,resolveArtifact:id=>'fixture:a'+id,resolveResource:id=>id===7?'wake-of-gods.mithril:mithril':undefined,resolveBankLayout:(id,bank)=>bank.troopPlacement?{layoutId:'eraBank'+id,baseLayout}:'creatureBankNarrow',spellMode:'era-single-filter',spellCatalog:[{eraId:1,nativeId:'core:spell',level:2,flags:1,schoolBits:15}]});
 assert.ok(r.compiled.some(x=>x.kind==='bank'&&x.id==='43'));
 if(fs.existsSync(baseSound)){for(const id of ['66','67'])assert.ok(r.compiled.some(x=>x.kind==='bank'&&x.id===id));assert.equal(r.modPatch.settings.combat.layouts.eraBank66.defenderUnits[5],7);}
 else {for(const id of ['66','67'])assert(r.diagnostics.some(x=>x.kind==='bank'&&x.id===id&&x.code==='MISSING_BANK_SOUND'));assert.equal(r.modPatch.settings?.combat?.layouts?.eraBank66,undefined);}
 const cfg=JSON.parse(r.files.get('content/config/objects/bank43.json'))['core:creatureBank'].types.eraBank43;assert(cfg.rewards[0].resources.some(r=>r.type==='wake-of-gods.mithril:mithril'&&r.amount===2));assert.deepEqual(cfg.rewards[0].spells,[{anyOf:['core:spell']}]);
});
test('production source mappings compile actual installed core/WoG/WotC creatures without fixture IDs',{skip:!process.env.TUM_SOURCE},async()=>{
 const {createProductionObjectResolvers}=await import('../scripts/era-bridge/objects/production-resolvers.mjs');const {prepareTumObjectImport}=await import('../scripts/era-bridge/objects/importer.mjs');const sourceRoot=process.env.TUM_SOURCE,projectRoot=process.cwd();
 const r=createProductionObjectResolvers({sourceRoot,projectRoot});assert.equal(r.resolveCreature(0),'core:pikeman');assert.equal(r.resolveCreature(154),'wake-of-gods.level8units:bloodDragon');assert.equal(r.resolveCreature(329),'third-upgrades:tumGhoul');assert.equal(r.resolveCreature(99999),undefined);
 const result=prepareTumObjectImport({sourceRoot,...r});const emitted=new Set(result.compiled.map(x=>`${x.kind}:${x.id}`));for(const id of ['dwelling:20_2','dwelling:20_4','bank:33','bank:38','bank:41','bank:47','bank:52','bank:62','bank:63'])assert(emitted.has(id),'Missing baseline import '+id);if(fs.existsSync(projectRoot+'/mod/tum-era/era-identities.json')){assert.equal(r.resolveCreature(202),'tum-era:cherub');assert.equal(r.resolveCreature(297),'tum-era:eraCreature297');for(const id of ['bank:53','bank:56','bank:57','bank:61','dwelling:20_3'])assert(emitted.has(id),'Missing newly closed import '+id);}assert.ok([...result.files.values()].every(b=>!b.toString('latin1').includes('fixture:')));
});
test('customDef native hook policy binds each original state to original verified assets',async()=>{
 const {compileEraAppearancePolicy}=await import('../scripts/era-bridge/objects/bank-extras.mjs');const bank={properties:[line],states:[{chance:25},{chance:25,customDef:'CB17.def'},{chance:25,customDef:'CB18.def'},{chance:10,customDef:'CB19.def'}]};
 const p=compileEraAppearancePolicy(bank,{resolveAnimation:x=>x});assert.deepEqual(p.chances,[25,25,25,10]);assert.deepEqual(p.animations,['TEST.def','CB17.def','CB18.def','CB19.def']);assert.throws(()=>compileEraAppearancePolicy(bank,{resolveAnimation:()=>undefined}),e=>e.code==='UNRESOLVED_BANK_ANIMATION');
});
test('compiled bank rewards preserve native map preset state instead of selecting every state',async()=>{
 const {compileTumBank}=await import('../scripts/era-bridge/banks.mjs');const state=chance=>({chance,guardians:{type:[1,1,1,1],count:[1,1,1,1]},resources:[0,0,0,0,0,0,0],creatureRewardType:-1,creatureRewardCount:0,artifactTypeCounts:[0,0,0,0]});const b={name:'Bank',states:[25,25,25,10].map(state)};
 const result=compileTumBank(b,{objectId:'bank',nativeTemplates:{base:convertObjectTemplate(line).template},guardsLayout:'creatureBankNarrow',resolveCreature:()=> 'core:pikeman',chanceMode:'era-fourth-state-remainder'});
 assert.deepEqual(result.definition['core:creatureBank'].types.bank.rewards.map(x=>x.mapDice),[0,1,2,3]);
});
test('customDef bank compiler emits runtime policy only when native hook mode is explicit',async()=>{
 const {compileTumBank}=await import('../scripts/era-bridge/banks.mjs');const state=(chance,customDef)=>({chance,...(customDef?{customDef}:{}),guardians:{type:[1,1,1,1],count:[1,1,1,1]},resources:[0,0,0,0,0,0,0],creatureRewardType:-1,creatureRewardCount:0,artifactTypeCounts:[0,0,0,0]});const bank={name:'Graphics bank',properties:[line],states:[state(50),state(50,'CB17.def')]};const opts={objectId:'bank',nativeTemplates:{base:convertObjectTemplate(line).template},guardsLayout:'creatureBankNarrow',resolveCreature:()=> 'core:pikeman',chanceMode:'era-fourth-state-remainder'};
 assert.throws(()=>compileTumBank(bank,opts),e=>e.diagnostics.some(d=>d.code==='UNSUPPORTED_PROPERTY'));
 const result=compileTumBank(bank,{...opts,appearanceMode:'native-state-hook',resolveAnimation:n=>n});assert.equal(result.definition['core:creatureBank'].types.bank.eraBankAppearance.animations[1],'CB17.def');
});
test('production bank upgrades use original MA:U or indexed vanilla fallback with exactly matching native upgrade',{skip:!process.env.TUM_SOURCE},async()=>{
 const {createProductionObjectResolvers}=await import('../scripts/era-bridge/objects/production-resolvers.mjs');const {prepareTumObjectImport}=await import('../scripts/era-bridge/objects/importer.mjs');const sourceRoot=process.env.TUM_SOURCE,projectRoot=process.cwd();
 const r=createProductionObjectResolvers({sourceRoot,projectRoot});assert.equal(r.resolveEraUpgrade(67).eraId,223);assert.equal(r.resolveEraUpgrade(30).eraId,31);assert.equal(r.resolveEraUpgrade(85).eraId,232); // Original duplicate declaration: second wins.
 const result=prepareTumObjectImport({sourceRoot,...r});const bank=id=>JSON.parse(result.files.get('content/config/objects/bank'+id+'.json'))['core:creatureBank'].types['eraBank'+id];
 assert.equal(bank('52').rewards[0].guards[0].upgradeChance,100);assert.equal(bank('63').rewards[0].guards[0].upgradeChance,31);assert.ok(bank('63').rewards[0].guards.slice(1).every(g=>g.upgradeChance===undefined));
});
test('production namespace prevents sprite collisions and source value/density enable real native bank RMG',{skip:!process.env.TUM_SOURCE},async()=>{
 const {createProductionObjectResolvers}=await import('../scripts/era-bridge/objects/production-resolvers.mjs');const {prepareTumObjectImport}=await import('../scripts/era-bridge/objects/importer.mjs');const sourceRoot=process.env.TUM_SOURCE,projectRoot=process.cwd();
 const r=createProductionObjectResolvers({sourceRoot,projectRoot});const result=prepareTumObjectImport({sourceRoot,...r});
 assert.ok([...result.files.keys()].filter(k=>k.startsWith('content/sprites/')).every(k=>k.startsWith('content/sprites/tum-era/objects/')));
 const bank=JSON.parse(result.files.get('content/config/objects/bank33.json'))['core:creatureBank'].types.eraBank33;assert.equal(bank.templates.base0.animation,'tum-era/objects/CB1.def');assert.deepEqual(bank.rmg,{value:1800,rarity:100});
 assert.ok(!result.files.has('content/sprites/CB1.def'));assert.ok(result.files.has('content/sprites/tum-era/objects/CB1.def'));
});
test('only the two verified multi-creature dwellings opt in to native neutral RMG',{skip:!process.env.TUM_SOURCE},async()=>{
 const {createProductionObjectResolvers}=await import('../scripts/era-bridge/objects/production-resolvers.mjs');const {prepareTumObjectImport}=await import('../scripts/era-bridge/objects/importer.mjs');const sourceRoot=process.env.TUM_SOURCE,projectRoot=process.cwd();
 const r=createProductionObjectResolvers({sourceRoot,projectRoot});const result=prepareTumObjectImport({sourceRoot,...r});
 for(const [id,value]of [['20_2',164196],['20_4',26908]]){const d=JSON.parse(result.files.get('content/config/objects/dwelling'+id+'.json'))['core:creatureGeneratorSpecial'].types['eraDwelling'+id];assert.deepEqual(d.rmg,{value,rarity:300,neutralAllowed:true});}
});
test('ERA zero-probability states remain available to explicit legacy map presets',async()=>{
 const {compileTumBank}=await import('../scripts/era-bridge/banks.mjs');const state=chance=>({chance,guardians:{type:[1,1,1,1],count:[1,1,1,1]},resources:[0,0,0,0,0,0,0],creatureRewardType:-1,creatureRewardCount:0,artifactTypeCounts:[0,0,0,0]});
 const result=compileTumBank({name:'Manual states',states:[100,0,0,10].map(state)},{objectId:'bank',nativeTemplates:{base:convertObjectTemplate(line).template},guardsLayout:'creatureBankNarrow',resolveCreature:()=> 'core:pikeman',chanceMode:'era-fourth-state-remainder'});
 const rewards=result.definition['core:creatureBank'].types.bank.rewards;assert.deepEqual(rewards.map(r=>r.mapDice),[0,1,2,3]);assert.deepEqual(rewards.map(r=>r.appearChance.max-r.appearChance.min),[100,0,0,0]);
});

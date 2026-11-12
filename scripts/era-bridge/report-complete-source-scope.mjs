/** Inventory the complete supplied TUM source, including artifacts without CFGs.
 * Active native entities are facts, not a claim of a complete ERA interpreter.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {SPECIALS,compileArtifact} from './artifacts/artifacts.mjs';
import {readJsonc,createProductionObjectResolvers} from './objects/production-resolvers.mjs';
import {identifiersByIndex} from './artifacts/importer.mjs';
import {validateOriginalRetaliationShield,ORIGINAL_RETALIATION_SHIELD} from './artifacts/original-retaliation157.mjs';
const source=path.resolve(process.argv[2]||'../Third-Upgrade-Mod-Full');
const output=process.argv[3]||'outputs/wog-priorities-0.4.147/complete-source-scope.json';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const manifest=readJsonc('mod/tum-era/mod.json'),active=new Map();
for(const config of manifest.artifacts)for(const[key,definition]of Object.entries(readJsonc('mod/tum-era/content/'+config)))if(/^artifact\d+$/.test(key))active.set(Number(key.slice(8)),{config,name:definition.text?.name});
const shieldRegistry='mod/tum-era/content/config/era-original-retaliation-shield.json';
if(fs.existsSync(shieldRegistry)){
 validateOriginalRetaliationShield(readJsonc(shieldRegistry));
 const config='mod/wake-of-gods/Mods/artifacts/content/config/artifacts/crimsonShieldOfRetribution.json',definition=readJsonc(config).crimsonShieldOfRetribution;
 if(definition?.bonuses?.defence?.val===2&&!Object.values(definition.bonuses).some(b=>b.type==='CREATURE_DAMAGE'))
  active.set(157,{config,name:definition.text.name,identity:ORIGINAL_RETALIATION_SHIELD,existingIdentity:true});
}
const language=readJsonc(path.join(source,'Lang/TUM_Artifacts.json')).era.artifacts;
const cfgRoot=path.join(source,'Data/artifacts');
const r=createProductionObjectResolvers({projectRoot:process.cwd(),sourceRoot:source});
const spells=identifiersByIndex(fs.readdirSync('work/vcmi-wasm/config/spells').filter(f=>f.endsWith('.json')).map(f=>readJsonc('work/vcmi-wasm/config/spells/'+f)));
const coreArtifacts=identifiersByIndex([readJsonc('work/vcmi-wasm/config/artifacts.json')]);
const artifacts=Object.keys(language).map(Number).filter(id=>id>=171&&id<=279);
// Source157 has a WoG-specific retaliation contract outside the added171+ range.
if(fs.existsSync(path.join(cfgRoot,'157.cfg')))artifacts.unshift(157);
const artifactRows=artifacts.map(id=>{
 const filename=path.join(cfgRoot,id+'.cfg'),cfg=fs.existsSync(filename)?fs.readFileSync(filename,'utf8'):'';
 const compiled=compileArtifact({id,text:cfg,aiPolicy:'native-vcmi',duplicates:'emerald-first',resolveCreature:r.resolveCreature,resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):undefined,resolveArtifact:id=>id<171&&coreArtifacts.has(id)?'core:'+coreArtifacts.get(id):active.has(id)?'tum-era:artifact'+id:undefined,authorizeAdapters:['artifactDailyConversions','artifactOpeningSummons']});
 return {sourceId:id,name:language[id]?.name,hasCfg:!!cfg,...(cfg?{cfgSHA256:sha(Buffer.from(cfg))}:{}),nativeActive:active.has(id),...(active.has(id)?{active:active.get(id)}:{requiredPolicies:compiled.adapters,diagnostics:compiled.diagnostics,...(id===157?{additionalRequirement:'Original retaliation against no-retaliation users is not established by Defence2 CFG.'}:{}),...(id===267?{additionalRequirement:'Source audit proves only22 wearer-army spell immunities; activate reviewed-silence-cape with corrected actual-behavior description and its native controls. No missing bilateral script is implied.'}:{})}),scriptedPolicies:SPECIALS[id]||[]};
});
const sourceScripts=fs.readdirSync(path.join(source,'Data/s')).filter(f=>f.endsWith('.erm')).sort().map(file=>{
 const bytes=fs.readFileSync(path.join(source,'Data/s',file)),text=bytes.toString('utf8');
 const triggers=[...text.matchAll(/^!\?([^;\r\n]+);/gm)].map(m=>m[1]);
 const receivers=Object.fromEntries([...new Set([...text.matchAll(/!!([A-Z]{2})/g)].map(m=>m[1]))].sort().map(key=>[key,[...text.matchAll(new RegExp('!!'+key,'g'))].length]));
 return {file,sha256:sha(bytes),lines:text.split(/\r?\n/).length,triggers,receivers,containsWindowsMemoryAccess:/!!UN:C|!!SN:E/.test(text)};
});
const sourceMechanisms=[
 {name:'Ring of Oblivion',source:'Third Upgrade Mod.erm1925..1989; source TODO Life Drain prohibition deliberately not invented',native:'lib/era/EraOblivion.h; cached either-hero flag, final revival resistance, occupied corpse geometry and post-battle Necromancy marker',ids:[268],evidence:['native-oblivion.json']},
 {name:'Ring of the Snake Eyesight mass Hypnotize',source:'Emerald Autospell60;5A13BB→5A69E0;5A8673 actual mastery/cached power and count×HPmax threshold',native:'Strict optional lib/era/EraMassHypnotizeArtifact.h; original-side mass reception/RNG and explicit50-turn effect',ids:[253],evidence:['native-mass-hypnotize253.json']},
 {name:'Interference cached battle power',source:'Third Upgrade Mod.erm1992..2040, original hero map stats retained',native:'server/era/EraInterferenceRuntime.h + BaseMechanics; named battle marker and hero-only power/duration, explicit fixed powers preserved',ids:[269,270,271],evidence:['native-interference.json']},
 {name:'Original WoG157 ordinary retaliation gate',source:'Original WoG70A007 scratch flag override at441AFF; identity157 preserved',native:'lib/era/EraOriginalRetaliationShield.h + ordinary BAP counter gate, original existing artifact without50percent adaptation',ids:[157],evidence:['native-original-retaliation157.json']},
 {name:'Cape of Silence actual wearer-army immunities',source:'Emerald config.cpp323 and ResistanceHook44A1A0;22 unique exact spell IDs, original prose corrected',native:'Native inherited SPELL_IMMUNITY bonuses, without a global spell-level prohibition',ids:[267],evidence:['native-silence-cape.json']},
 {name:'Atma persisted equalization events',source:'Third Upgrade Mod.erm1692..1759 AE/CM2 and case-normalized ERA associative state',native:'server/era/EraAtmaRuntime.h; versioned permanent artifact state, explicit mobile refresh',ids:[264,265],evidence:['native-atma.json']},
 {name:'Diplomat perceived army strength',source:'TUM180 original description, components66/67/68 and Archer interoperability hooks',native:'lib/era/EraAdvancedArtifactRuntimeNative.h; neutral and ThievesGuild-only hooks',ids:[180],evidence:['native-diplomat-cloak.json']},
 {name:'Lightning Rod bilateral immunity and supplementary raw bolt',source:'Third Upgrade Mod.erm1760..1843; BM:K direct injury after correction, before ordinary chain damage',native:'lib/era/EraAdvancedArtifactRuntimeNative.h and spell Damage/Mechanics hooks',ids:[220],evidence:['native-lightning-rod.json']},
 {name:'Dwarven Mine expert fixed50 opening',source:'Emerald CastArtifactSpell; original mode2 caller power; native original SPTRAITS effect',native:'server/battles/BattleFlowProcessor.cpp ERA_FIXED_POWER_OPENING_SPELL',ids:[222],evidence:['native-opening-mine.json','native-opening-mine-mobile-portrait.json']},
 {name:'Artifact opening summons',source:'Emerald3/emerald/events.cpp OnBattleStackObtainsTurn opening service and artifact CFGs',native:'server/era/EraArtifactOpeningSummons.h',ids:[219,231,279],evidence:['native-opening-backpack-shield.json']},
 {name:'Equipped enemy morale/luck artifacts',source:'Third Upgrade Mod.erm equipped artifact combat bonuses',native:'Native BATTLE_WIDE OPPOSITE_SIDE bonuses with BONUS_OWNER_UPDATER',ids:[183,184,185,186,187,188,249,250,252],evidence:['native-opponent-artifacts.json']},
 {name:'Equipped daily army conversion',source:'Emerald3 daily creature upgrades and artifact CFGs',native:'server/processors/NewTurnProcessor.cpp reviewed daily conversion dispatch',ids:[202,273,274,277,262],evidence:['native-conversion-artifacts.json']},
 {name:'Exchange Cloak',source:'Third Upgrade Mod.erm KO_cape / KO_cape2',native:'server/era/EraExchangeCloakRuntime.h',ids:[261],evidence:['native-battle-artifacts.json']},
 {name:'Resurrection / Animate Dead / Implosion amplification',source:'Third Upgrade Mod.erm tum_CastMassiveSpell and tum_Battle_CanStackReceiveSpell',native:'server/era/EraArtifactMassSpellsRuntime.h',ids:[262,263],evidence:['native-battle-artifacts.json']},
 {name:'Golden Goose income, Reflection post-aura resistance and Ring elemental freedom',source:'Third Upgrade Mod.erm daily income / OnDwarfMagicResistance / tum_ActivateElemRing',native:'lib/era/EraGooseReflectionRuntime.h and EraElementalRing.h',ids:[179,181,197],evidence:['native-utility-artifacts.json']}
].map(row=>({...row,allEntitiesActive:row.ids.every(id=>active.has(id)),evidence:row.evidence.map(file=>({file,available:fs.existsSync(path.join(path.dirname(output),file))}))}));
const result={source:'Supplied Third Upgrade Mod3.5 source tree, not all unrelated ERA/WoG add-ons',fullEraCompatibility:false,
 summary:{sourceArtifacts:artifactRows.length,activeArtifacts:artifactRows.filter(a=>a.nativeActive).length,inactiveArtifacts:artifactRows.filter(a=>!a.nativeActive).length,sourceScripts:sourceScripts.length,sourceTriggerDeclarations:sourceScripts.reduce((n,s)=>n+s.triggers.length,0)},
 interpretation:'Entity activation records native content availability. It does not establish global ERM parity. Inactive artifacts list source obligations; scripts require native event equivalents rather than Windows pointer execution.',
 sourceArtifacts:artifactRows,sourceScripts,namedNativeMechanisms:sourceMechanisms,
 scopeBoundary:{requestedPriorityWork:"Creature roster/evolutions, artifacts/equipment, map choices/banks, machines, specializations and their source event contracts",inventoryMeaning:"The 109 ERM files are the supplied mod inventory, not 109 required generic interpreter implementations. Named mechanisms above identify the native contracts actually ported; evidence availability and activation are separate facts."},
 engineBoundary:{arbitraryWindowsMemoryWrites:false,windowsDllCallbacks:false,fullErmInterpreter:false,currentlySupportedInitialization:'Strict reviewed roster option declarations only; see erm-options.mjs',sourceScriptPorts:'Named native adapters cover individual proven source mechanisms. Compare per-feature native evidence before enabling additional actors.'}};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.summary));

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventoryErm,sha256} from '../compatibility/erm-inventory.mjs';
import {readJsonc} from '../objects/production-resolvers.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
export const sourceScript='tests/fixtures/era-gameplay/enhanced-henchmen-1.2.erm';
export const sourceSettings='tests/fixtures/era-gameplay/enhanced-henchmen-1.2.jsonc';
export const contractPath='scripts/era-bridge/gameplay/henchmen.json';
export const nativeRules='work/vcmi-wasm/lib/era/EraHenchmanRules.h';

const scopes={
 hench_LoadGlobalConfig:'Settings field defaults and clamps; no JSON/runtime-global host adapter.',
 hench_GetHenchLevelRate:'Classic and alternative branches with source-declared Single input/output and truncation; source model, not binary differential validation.',
 hench_GetHenchLevelDetails:'Integer level, calendar/hero bonuses and next-level arithmetic; no hero lookup adapter.',
 hench_GetHenchAdditionalStats:'Additional-stat arithmetic; no battlefield bonus ownership/lifecycle adapter.',
 hench_ResurrectHench:'Gold-cost arithmetic only; no transaction, ownership check or resurrection dialogue.',
 hench_ChooseHench:'Replacement experience loss only; no army/artifact transaction or selection dialogue.',
 hench_GiveExpAfterBattle:'Integer reward arithmetic and source-declared Single square root; caller-supplied random/global inputs; no result hook.',
 hench_CheckIfHenchIsEligible:'Army eligibility with explicitly resolved emissary and empty-army settings.',
 hench_ChooseAiHench:'Stable shots/fight-value candidate priority only; no AI army or banner mutation.',
 hench_StackExpGain:'XP gain/cap/banner arithmetic only; no XP table lookup or saved state mutation.',
 hench_StackExpBF:'XP difficulty scaling/cap only; no banner or battlefield stack adapter.',
 hench_GetHenchPosition:'Source proposed hex only; native collision/layout resolution is not admitted.',
 hench_ManageExtraSpells:'Knowledge/casts arithmetic only; no combat bonus adapter.'
};

export function buildHenchmenContract(projectRoot=root){
 const script=fs.readFileSync(path.join(projectRoot,sourceScript));
 const settingsBytes=fs.readFileSync(path.join(projectRoot,sourceSettings));
 const inventory=inventoryErm(script,sourceScript);
 if(inventory.diagnostics.length)throw Error('Unterminated command in Henchmen reference');
 const settings=readJsonc(path.join(projectRoot,sourceSettings)).henchmen.settings;
 const blocks=Object.entries(scopes).map(([symbol,scope])=>{
  const event=inventory.events.find(row=>row.source.trigger===`!?FU(${symbol});`);
  if(!event)throw Error('Missing source block '+symbol);
  return {symbol,source:event.source,status:'arithmetic-unit-tested',scope};
 });
 return {
  schema:1,pack:'Enhanced Henchmen',version:'1.2',
  upstream:{repository:'https://github.com/ERA-Projects/era-project-eng',
   commit:'233993be3eea4646b5c9f351e74f0bb51101adf6',
   script:'Mods/Enhanced Henchmen/Data/s/29 wog - henchmen.erm',
   settings:'Mods/Enhanced Henchmen/Lang/henchman mod.json',license:'MIT (upstream repository)'},
  sources:[{file:sourceScript,sha256:sha256(script)},{file:sourceSettings,sha256:sha256(settingsBytes)}],
  defaults:settings,blocks,nativeRules,
  mathSource:{file:'scripts/era-bridge/gameplay/math-source.json',
   sha256:sha256(fs.readFileSync(path.join(projectRoot,'scripts/era-bridge/gameplay/math-source.json')))},
  nativeRulesSha256:sha256(fs.readFileSync(path.join(projectRoot,nativeRules))),
  enabled:false,status:'partial-rule-library',
  unresolved:[
   'Floating-point primitives are derived from primary kernel source; binary differential validation has not been obtained.',
   'Reward: source uses i^battleExpAIPct^ while configuration defines i^hench_battleExpAIPct^; no substitution is admitted.',
   'Native core adapters exist; complete source fidelity and configurable profiles are not admitted.',
   'Native save/load, mobile core and previous Henchmen-engine saves pass; campaign transfer and older pre-Henchmen saves remain to validate.',
   'Army selection/replacement and resurrection are connected; banner equipment is not ported.',
   'Battlefield actor, stats, spells and level-scaled guardians are connected; full death/action interactions remain incomplete.',
   'Full AI progression, classic UI, inventory/spell edge cases and whole-pack native scenarios are not validated.'
  ]
 };
}

export function verifyHenchmenContract(projectRoot=root){
 const saved=JSON.parse(fs.readFileSync(path.join(projectRoot,contractPath),'utf8'));
 const actual=buildHenchmenContract(projectRoot);
 if(JSON.stringify(saved)!==JSON.stringify(actual))throw Error('Stale Enhanced Henchmen source contract');
 return actual;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.slice(2).some(value=>value!=='--check'))throw Error('Usage: henchmen.mjs [--check]');
 if(process.argv.includes('--check'))verifyHenchmenContract();
 else fs.writeFileSync(path.join(root,contractPath),JSON.stringify(buildHenchmenContract(),null,2)+'\n');
 console.log('Enhanced Henchmen: partial arithmetic contracts checked; gameplay admission is disabled.');
}

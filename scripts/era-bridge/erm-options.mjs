/** Strict initialization-only subset. This is not an ERM runtime or memory-write interpreter. */
import {BridgeError} from './resources.mjs';
const reject=(code,message)=>{throw new BridgeError(code,message);};
export function compileRosterOptionBlock(text,{options,resolveCreature,resolveTown,baselineTowns}={}){
 const lines=text.split(/\r?\n/).map(s=>s.split(';')[0].trim()).filter(s=>s&&!s.startsWith('//'));
 if(lines[0]!=='!?FU(OnGameEnter)')reject('UNSUPPORTED_OPTION_EVENT','Only original initialization blocks are supported');
 const query=/^!!UN:P\((WOG_OPT_4TH_UPGRADES|WOG_OPT_8TH_MONSTERS)\)\/\?y99$/.exec(lines[1]||''),guard=/^!!FU&y99=([01]):E$/.exec(lines[2]||'');
 if(!query||!guard)reject('UNSUPPORTED_OPTION_CONDITION','Expected an explicit source option and zero/one early return');
 const name=query[1];if(typeof options?.[name]!=='boolean')reject('MISSING_EXPLICIT_OPTION','No default is inferred for '+name);
 const assignments=lines.slice(3).map(line=>{const m=/^!!UN:T([0-8])\/([67])\/([03])\/(-?\d+)$/.exec(line);if(!m)reject('UNSUPPORTED_OPTION_INSTRUCTION','Unbound source instruction: '+line);return{town:Number(m[1]),tier:Number(m[2]),variant:Number(m[3]),creature:Number(m[4])};});
 if(assignments.length!==9||new Set(assignments.map(a=>a.town)).size!==9)reject('INCOMPLETE_OPTION_ROSTER','All nine source towns must be present once');
 if(assignments.some(a=>a.tier!==(name==='WOG_OPT_4TH_UPGRADES'?6:7)||a.variant!==(name==='WOG_OPT_4TH_UPGRADES'?3:0)||a.creature< -1))reject('INVALID_OPTION_ROSTER','Source option shape changed');
 const enabled=Number(options[name])!==Number(guard[1]);if(!enabled)return{option:name,executed:false,factions:{},assignments};
 const factions={};for(const a of assignments){const key=resolveTown?.(a.town),base=baselineTowns?.[key];if(!key||!Array.isArray(base)||base.some(row=>!Array.isArray(row)||!row.length))reject('MISSING_TOWN_BASELINE','Complete native roster required');const rows=structuredClone(base);
  if(a.creature===-1){if(a.tier===7){if(rows.length>8)reject('UNSUPPORTED_EXTRA_ROSTER','Cannot remove another mod’s additional tiers');rows.splice(7);}else{if(!rows[6]||rows[6].length<3||rows[6].length>4)reject('UNSUPPORTED_VARIANTS','Cannot remove unknown creature variants');rows[6]=rows[6].slice(0,3);}}
  else{const creature=resolveCreature?.(a.creature);if(typeof creature!=='string'||!creature.includes(':'))reject('UNRESOLVED_OPTION_CREATURE','Unclosed source creature '+a.creature);if(a.tier>rows.length||a.variant>(rows[a.tier]?.length||0))reject('SPARSE_OPTION_ROSTER','Native roster must stay contiguous');rows[a.tier]??=[];rows[a.tier][a.variant]=creature;}
  factions[key]={town:{creatures:rows}};
 }
 return{option:name,executed:true,factions,assignments,scope:'Source initialization roster assignments only; no buildings, events, save mutation or DLL execution.'};
}
export function originalRosterOptionBlocks(script){return [...script.matchAll(/!\?FU\(OnGameEnter\);\s*\r?\n!!UN:P\(WOG_OPT_(?:4TH_UPGRADES|8TH_MONSTERS)\)\/\?y99;\s*\r?\n!!FU&y99=[01]:E;\s*(?:\r?\n!!UN:T\d+\/\d+\/\d+\/-?\d+;\s*){9}/g)].map(m=>m[0]);}

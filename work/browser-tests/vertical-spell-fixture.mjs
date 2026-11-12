// Visual fixtures preserve original animations with a common nonlethal payload.
// They are generated exclusively in a temporary site, never in published mod/.
import fs from 'node:fs';import path from 'node:path';import JSON5 from 'json5';
export function makeVerticalSpellFixture(root){
 const entries=[];
 for(const name of fs.readdirSync(path.join(root,'work/vcmi-wasm/config/spells'))){if(name==='adventure.json')continue;for(const [key,value] of Object.entries(JSON5.parse(fs.readFileSync(path.join(root,'work/vcmi-wasm/config/spells',name),'utf8'))))entries.push({source:'core',key,...value});}
 function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='visual-spell-review')scan(file);}else if(e.name==='mod.json'){let mod;try{mod=JSON5.parse(fs.readFileSync(file,'utf8'));}catch{continue;}for(const ref of mod.spells||[]){if(ref.includes('vertical-spell'))continue;const f=path.join(dir,'content',ref);if(!fs.existsSync(f))continue;for(const [key,value] of Object.entries(JSON5.parse(fs.readFileSync(f,'utf8'))))if(value.animation)entries.push({source:path.relative(path.join(root,'mod'),dir),key,...value});}}}}
 scan(path.join(root,'mod'));
 function obstacleAnimations(value,out=new Set()){if(value&&typeof value==='object')for(const [key,v] of Object.entries(value)){if(['animation','appearAnimation'].includes(key)&&typeof v==='string')out.add(v);else obstacleAnimations(v,out);}return [...out];}
 const rows=entries.map((e,i)=>({key:'visual'+i,source:e.source,spell:e.key,originalIndex:e.index,animation:e.animation||{},targetType:e.targetType||'CREATURE',global:e.levels?.base?.range==='X',obstacles:JSON.stringify(e.levels||{}).includes('appearAnimation'),obstacleAnimations:obstacleAnimations(e.levels)}));
 const spells={};
 for(const row of rows){if(!Object.keys(row.animation).length)continue;
  spells[row.key]={name:'Visual '+row.key+' '+row.spell,type:'combat',targetType:row.targetType==='NO_TARGET'||row.global?'NO_TARGET':'CREATURE',school:{air:true},level:1,power:0,defaultGainChance:0,flags:{negative:true,damage:true},graphics:{iconBook:'CmNumWin',iconEffect:'CmNumWin',iconScroll:'CmNumWin',iconScenarioBonus:'CmNumWin'},animation:row.animation,targetCondition:{},levels:{base:{range:row.targetType==='NO_TARGET'||row.global?'X':'0',cost:0,power:1,description:row.spell,battleEffects:{visualDamage:{type:'core:damage'}},targetModifier:{smart:false}},none:{},basic:{},advanced:{},expert:{}}};
 }
 const dest=path.join(root,'mod/goonk/Content/config');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/vertical-spell-review.json',JSON.stringify(spells));fs.writeFileSync(dest+'/vertical-spell-artifact.json',JSON.stringify({'core:spellBook':{bonuses:{reviewCasts:{type:'HERO_SPELL_CASTS_PER_COMBAT_TURN',val:1000}}}}));
 const manifest=path.join(root,'mod/goonk/mod.json'),mod=JSON.parse(fs.readFileSync(manifest));mod.spells=[...new Set([...(mod.spells||[]),'config/vertical-spell-review.json'])];mod.artifacts=[...new Set([...(mod.artifacts||[]),'config/vertical-spell-artifact.json'])];fs.writeFileSync(manifest,JSON.stringify(mod));
 return rows;
}
if(process.argv[1]?.endsWith('vertical-spell-fixture.mjs')){const root=process.argv[2];if(!root||!/^\/(?:private\/)?tmp\//.test(path.resolve(root)))throw Error('Visual fixtures must be generated in a temporary site');const rows=makeVerticalSpellFixture(root);fs.writeFileSync(path.join(root,'spell-visual-catalog.json'),JSON.stringify(rows,null,2));console.log('Catalogued',rows.length,'spells;',rows.filter(r=>Object.keys(r.animation).length).length,'animation definitions');}

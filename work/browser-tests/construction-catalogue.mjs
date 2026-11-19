// Real deployed faction rules, shared by the construction UI stress test.
import fs from 'node:fs';
import {townBuildingNames} from '../../web/town-building-names.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/("(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,(match,string)=>string||'').replace(/,\s*([}\]])/g,'$1'));
const library=read('work/vcmi-wasm/config/buildingsLibrary.json');
export const factions=['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux','goonk'];
export function constructionCatalogue(faction,language='fr'){
 const goonk=faction==='goonk',base=read(goonk?'mod/goonk/Content/config/faction.json':`work/vcmi-wasm/config/factions/${faction}.json`)[faction].town.buildings;
 const extra=goonk?{}:read(`mod/third-upgrades/content/config/town-screen/${faction}/factions.json`)[`core:${faction}`].town.buildings;
 const buildings=Object.fromEntries([...new Set([...Object.keys(base),...Object.keys(extra)])].map(key=>[key,{...library[key],...base[key],...extra[key]}]));
 const clean=key=>key.split(':').at(-1),memo=new Map();
 const unique=plans=>{const map=new Map(plans.map(plan=>[[...plan].sort().join(','),plan]));return [...map.values()].filter((plan,index,all)=>!all.some((other,j)=>j!==index&&other.size<plan.size&&[...other].every(key=>plan.has(key))));};
 const combine=(a,b)=>unique(a.flatMap(left=>b.map(right=>new Set([...left,...right]))));
 function rules(rule,stack){
  if(!rule||!rule.length)return [new Set()];
  if(typeof rule==='string')return visit(clean(rule),stack);
  const [operator,...rest]=rule;
  if(operator==='anyOf')return unique(rest.flatMap(item=>rules(item,stack)));
  if(operator==='noneOf')return [new Set()];
  return (operator==='allOf'?rest:rule).reduce((plans,item)=>combine(plans,rules(item,stack)),[new Set()]);
 }
 function visit(key,stack=[]){
  if(memo.has(key))return memo.get(key);
  if(stack.includes(key))throw Error(`Dependency cycle ${faction}: ${[...stack,key]}`);
  const building=buildings[key];if(!building)throw Error(`Missing building ${faction}:${key}`);
  const next=[...stack,key];let plans=rules(building.requires,next);
  if(building.upgrades)plans=combine(plans,visit(clean(building.upgrades),next));
  plans=plans.map(plan=>new Set([...plan,key]));memo.set(key,plans);return plans;
 }
 const routes=Object.keys(buildings).filter(key=>/^dwelling/.test(key)).map(key=>{const alternatives=visit(key).sort((a,b)=>a.size-b.size),steps=[...alternatives[0]];return{key,steps,manual:steps.filter(step=>!['auto','special'].includes(buildings[step].mode)),name:townBuildingNames[faction]?.[key]?.[language]||buildings[key].name||key};});
 const records=Object.entries(buildings).map(([key,building])=>({id:building.id,key:`${goonk?'goonk':'core'}:${key}`,name:townBuildingNames[faction]?.[key]?.[language]||building.name||key,description:building.description||'',cost:['wood','mercury','ore','sulfur','crystal','gems','gold','mithril'].map(resource=>building.cost?.[resource]||0),built:false,allowed:false,state:8,missingPrerequisites:[...visit(key)[0]].filter(step=>step!==key).map(step=>buildings[step].id)}));
 return {faction,buildings:records,routes};
}
if(process.argv[1]?.endsWith('/construction-catalogue.mjs'))for(const faction of factions){const {routes}=constructionCatalogue(faction);const longest=routes.sort((a,b)=>b.steps.length-a.steps.length)[0];console.log(JSON.stringify({faction,...longest,manual:longest.manual.length,total:longest.steps.length}));}

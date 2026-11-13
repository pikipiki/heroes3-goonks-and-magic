/** Seed valid pre-existing towns; the eighth buildings are always bought natively. */
import assert from'node:assert/strict';
import{readJsonc}from'../../scripts/era-bridge/objects/production-resolvers.mjs';
const towns=['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'];
export function eighthTownPrerequisites(){
 return Object.fromEntries(towns.map(name=>{
  const key='core:'+name,core=readJsonc('work/vcmi-wasm/config/factions/'+name+'.json'),third=readJsonc('mod/third-upgrades/content/config/town-screen/'+name+'/factions.json'),tum=readJsonc('mod/tum-era/content/config/'+name+'.json');
  const buildings={};
  for(const layer of[(core[key]||core[name]).town.buildings,third[key]?.town?.buildings,tum[key]?.town?.buildings])for(const[k,v]of Object.entries(layer||{}))buildings[k]={...buildings[k],...v};
  const built=new Set(['villageHall','fort','tavern',...Array.from({length:6},(_,i)=>'dwellingLvl'+(i+1))]),visited=new Set();
  const add=key=>{key=key.replace(/^core:/,'');assert(!['citadel','castle','grail','dwellingLvl8','dwellingUpLvl8'].includes(key),'Fixture must retain Fort-only growth and unbuilt eighth tier');built.add(key);visit(key);};
  const walk=value=>{if(typeof value==='string'){assert(value!=='anyOf'&&value!=='noneOf','Review a new prerequisite operator explicitly');if(value!=='allOf')add(value);}else if(Array.isArray(value))for(const x of value)walk(x);else assert(value==null,'Reviewed building expression required');};
  const visit=key=>{if(visited.has(key))return;visited.add(key);walk(buildings[key]?.requires);if(buildings[key]?.upgrades)add(buildings[key].upgrades);};
  for(const key of [...built])visit(key);
  return[name,[...built].map(key=>'core:'+key)];
 }));
}

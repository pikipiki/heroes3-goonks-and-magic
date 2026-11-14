import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import{readJsonc}from'../scripts/era-bridge/objects/production-resolvers.mjs';
import{DWELLING_CLOSURE}from'../scripts/era-bridge/objects/stage-dwelling-closure.mjs';
test('Both adventures make all44 new dwelling actors reachable through real recruitment and declared upgrades',()=>{
 const project=process.cwd(),union=process.env.DWELLING185_UNION,resolver={byNative:new Map()},manifest=readJsonc('mod/tum-era/mod.json'),objects=new Map();
 // Reachability depends on registered native definitions, not the optional original ERM/archive tree.
 const creatures=(entries,scope)=>{for(const[key,value]of Object.entries(entries)){const native=key.includes(':')?key:scope+':'+key;resolver.byNative.set(native,{...(resolver.byNative.get(native)??{}),...value});}};
 for(const name of fs.readdirSync('work/vcmi-wasm/config/creatures').filter(n=>n.endsWith('.json')))creatures(readJsonc('work/vcmi-wasm/config/creatures/'+name),'core');
 for(const[root,scope]of [['mod/wake-of-gods/Mods/level8Units','wake-of-gods.level8units'],['mod/wake-of-gods/Mods/creatures','wake-of-gods.creatures'],['mod/wake-of-gods/Mods/messengersAndEmissaries','wake-of-gods.messengersandemissaries'],['mod/third-upgrades','third-upgrades'],['mod/tum-era','tum-era']])for(const file of readJsonc(root+'/mod.json').creatures??[])creatures(readJsonc(path.join(root,'content',path.extname(file)?file:file+'.json')),scope);
 const load=(document,scope)=>{for(const[group,value]of Object.entries(document))for(const[key,definition]of Object.entries(value.types??{}))objects.set((group.includes(':')?group:scope+':'+group)+'|'+(key.includes(':')?key:scope+':'+key),{definition,scope});};
 for(const name of fs.readdirSync('work/vcmi-wasm/config/objects').filter(n=>n.endsWith('.json')))load(readJsonc('work/vcmi-wasm/config/objects/'+name),'core');
 for(const file of manifest.objects)load(readJsonc('mod/tum-era/content/'+file),'tum-era');
 if(union){const review=readJsonc(union+'/union-review.json');for(const file of review.objects)load(readJsonc(path.join(union,'content',file)),'tum-era');for(const file of ['config/source-dwelling-actors.candidate.json','config/source-bank-actors.candidate.json',...(review.additionalCreatureConfigs??[])])for(const[key,value]of Object.entries(readJsonc(path.join(union,'content',file)))){const native=key.includes(':')?key:'tum-era:'+key;resolver.byNative.set(native,{...(resolver.byNative.get(native)??{}),...value});}}
 const expected=DWELLING_CLOSURE.filter(id=>![253,272,281,289,290,301,302,330,340,358].includes(id)).map(id=>'tum-era:eraCreature'+id),catalogue=readJsonc('scripts/wog-adventure-recruitment.json');
 for(const map of catalogue.maps)for(const side of [0,1]){
  const seen=new Set(),pending=[];for(const p of map.placements.filter(p=>p.side===side&&p.kind!=='original-probabilistic-source')){const entry=objects.get(p.object.type+'|'+p.object.subtype);assert(entry,'Registered recruitment object '+p.id);for(const key of (entry.definition.creatures??[]).flat())pending.push(key.includes(':')?key:entry.scope+':'+key);}
  while(pending.length){const key=pending.pop();if(seen.has(key))continue;seen.add(key);const definition=resolver.byNative.get(key);assert(definition,'Registered troop '+key);for(const target of definition.upgrades??[])pending.push(target.includes(':')?target:key.split(':')[0]+':'+target);}
  for(const key of expected)assert(seen.has(key),map.map+' side'+side+' cannot recruit/upgrade '+key);
 }
});

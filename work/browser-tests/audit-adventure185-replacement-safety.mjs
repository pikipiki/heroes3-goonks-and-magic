/** Conservative geometry proof for the ten authored original source sites.
 * Covers survival and every native replacement template, without forcing RNG.
 */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function auditAdventureReplacementSafety({mapsRoot='/tmp/goonk-maps185-recruiting',union='/tmp/goonk-replacement185-union-recruiting',cataloguePath='scripts/wog-adventure-recruitment.json'}={}){
 const policyBytes=fs.readFileSync(path.join(union,'content/config/era-object-replacements-v1.json')),policy=JSON.parse(policyBytes),catalogueBytes=fs.readFileSync(cataloguePath),catalogue=JSON.parse(catalogueBytes);
 assert.equal(policy.contract,'source-object-replacements-v1');assert.equal(policy.plans.length,102);assert.equal(catalogue.schemaVersion,1);assert.equal(catalogue.coverage.newActorIds.length,44);
 const rules=policy.plans.filter(p=>p.enabled).flatMap(plan=>plan.rules.filter(rule=>rule.source&&rule.percentage>0&&rule.sourceType>=0&&rule.sourceSubtype>=0).map(rule=>({plan,rule}))),key=i=>i.group+'|'+i.type,sourcePairs=new Set(rules.map(({rule})=>key(rule.source)));
 assert.equal(sourcePairs.size,36);assert(!rules.some(({rule})=>rule.source.group==='core:town'),'Random towns must remain outside replacement sources');
 const definitions=new Map();for(const folder of ['mod/tum-era/content/config/objects',path.join(union,'content/config/objects')])for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.json'))){const data=JSON.parse(fs.readFileSync(path.join(folder,file)));for(const[group,value]of Object.entries(data))for(const[type,definition]of Object.entries(value.types??{}))definitions.set((group.includes(':')?group:'tum-era:'+group)+'|'+(type.includes(':')?type:'tum-era:'+type),definition)}
 const geometries=new Map(catalogue.geometries.map(g=>[g.id,g.alternatives]));
 for(const plan of catalogue.maps){
  assert.equal(plan.placements.length,76);const sources=plan.placements.filter(p=>p.kind==='original-probabilistic-source');assert.equal(sources.length,10);for(const side of [0,1])assert.equal(sources.filter(p=>p.side===side).length,5);
  for(const p of plan.placements){const actual=geometries.get(p.id);assert(actual?.length,'Catalogue geometry '+p.id);if(p.kind==='original-probabilistic-source'){
    const matching=rules.filter(({rule})=>key(rule.source)===key({group:p.object.type,type:p.object.subtype}));assert(matching.length);
    assert.deepEqual(p.sourceRules,matching.map(({plan,rule})=>({program:plan.parameterId,percentage:rule.percentage,xOffset:rule.xOffset,target:plan.target})),'Original probability/order/offset retained '+p.id);
    const expected=[{template:p.object.template,xOffset:0},...matching.flatMap(({plan,rule})=>{const target=definitions.get(key(plan.target));assert(target,'Unclosed target '+key(plan.target));return Object.values(target.templates).map(template=>({template,xOffset:rule.xOffset}))})];
    assert.deepEqual(actual,expected,'Envelope must cover survival and every current policy target template '+p.id);
   }else{assert(!sourcePairs.has(key({group:p.object.type,type:p.object.subtype})),'An explicit native habitat unexpectedly became a replacement source');const native=definitions.get(key({group:p.object.type,type:p.object.subtype}));if(native)assert.deepEqual(actual,Object.values(native.templates).map(template=>({template,xOffset:0})),'Native habitat geometry drift '+p.id);else assert.deepEqual(actual,[{template:p.object.template,xOffset:0}],'Native core habitat geometry drift '+p.id)}
  }
 }
 const report=JSON.parse(execFileSync('python3',['-c',String.raw`import json,zipfile,sys,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('m','scripts/build-wog-adventure-maps.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
catalogue=json.loads(Path(sys.argv[2]).read_text());out=[]
for plan in catalogue['maps']:
 file=Path(sys.argv[1])/plan['map']
 with zipfile.ZipFile(file)as z:objects=json.loads(z.read('objects.json'));h=json.loads(z.read('header.json'));terrain=json.loads(z.read('surface_terrain.json'))
 byname={o['instanceName']:o for o in objects};sites={p['object']['instanceName']for p in plan['placements']};size=h['mapLevels']['surface']['width'];homes=[(17,18),(size-18,size-17)]
 for p in plan['placements']:assert byname[p['object']['instanceName']]==p['object'],'Authored site differs from catalogue'
 water={(x,y)for y,row in enumerate(terrain)for x,t in enumerate(row)if t[:2]in ['wt','rk']};realblocked=water|set().union(*(m.cells(o)for o in objects));before=[m.reachable(size,realblocked,p)for p in homes]
 originals=[o for o in objects if o['instanceName']not in sites];occupied=set().union(*(m.cells(o,'ABTV')for o in originals if o['type']not in ['core:oakTrees','core:rock']));protected={(x+dx,y+dy)for x,y in occupied for dx in range(-1,2)for dy in range(-1,2)}
 geometries={g['id']:g['alternatives']for g in catalogue['geometries']};envelope=set();reserved=set();approaches=[];alternatives=0
 for p in plan['placements']:
  footprint=set();blockers=set()
  for a in geometries[p['id']]:
   t=a['template'];mask=t['mask'];visit=[(len(row)-1-x,len(mask)-1-y)for y,row in enumerate(mask)for x,c in enumerate(row)if c in 'AT'];assert len(visit)==1
   vx=p['visit'][0]+a['xOffset'];vy=p['visit'][1];obj={'x':vx+visit[0][0],'y':vy+visit[0][1],'template':t};footprint|=m.cells(obj,'ABTV');blockers|=m.cells(obj);alternatives+=1
   approaches.append((p['side'],[(vx+dx-1,vy+dy-1)for dy,row in enumerate(t['visitableFrom'])for dx,c in enumerate(row)if c=='+']))
  assert not footprint&(protected|water|reserved),'Outcome overlaps an objective or another site';assert all(0<=x<size and 0<=y<size for x,y in footprint)
  reserved|=footprint;envelope|=blockers
 after=[m.reachable(size,realblocked|envelope,p)for p in homes]
 assert all(any(p in after[side]for p in choices)for side,choices in approaches),'Possible source outcome is inaccessible'
 assert all(not((before[side]-envelope)-after[side])for side in [0,1]),'Source outcome disconnects a previously reachable path'
 out.append({'file':str(file),'name':h['name'],'objectCount':len(objects),'catalogueSites':len(sites),'possibleTemplateOutcomes':alternatives,'protectedOriginalObjects':len(originals),'sourceEnvelopeBfsPassed':True,'reachableBefore':[len(r)for r in before],'reachableWorstCase':[len(r)for r in after]})
print(json.dumps(out))`,mapsRoot,cataloguePath],{encoding:'utf8'}));
 const inventory=JSON.parse(execFileSync('python3',['-c',String.raw`import json,zipfile,sys
print(json.dumps([json.loads(zipfile.ZipFile(f).read('objects.json'))for f in sys.argv[1:]]))`,...report.map(m=>m.file)],{encoding:'utf8'}));
 for(const[index,map]of report.entries()){for(const object of inventory[index])if(object.type.startsWith('core:random'))assert.equal(object.type,'core:randomTown','Unproven random object resolution');const plan=catalogue.maps.find(p=>p.map===path.basename(map.file)),expected=plan.placements.filter(p=>p.kind==='original-probabilistic-source').map(p=>p.object.instanceName).sort(),eligible=inventory[index].filter(o=>sourcePairs.has(key({group:o.type,type:o.subtype}))).map(o=>o.instanceName).sort();assert.deepEqual(eligible,expected,'Only the ten explicitly reviewed source sites may be replaced');map.sha256=sha(fs.readFileSync(map.file));map.sourceMatches=eligible.length;map.sourceSites=expected}
 return {passed:true,proofKind:'static-full-replacement-envelope',policySha256:sha(policyBytes),catalogueSha256:sha(catalogueBytes),sourcePrograms:102,sourcePairs:[...sourcePairs].sort(),maps:report,nativeProofClaimed:false,scope:'The ten original source habitats are intentional. Their unchanged probabilities and all current target templates fit the checked blocking envelope. Original objectives and reachable approaches remain protected; no original-seed equivalence is claimed.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===new URL(import.meta.url).pathname){const report=auditAdventureReplacementSafety({mapsRoot:process.env.ADVENTURE_MAPS_ROOT,union:process.env.DWELLING185_UNION}),output=process.env.REVIEW_OUTPUT||'/tmp/goonk-adventure185-replacement-envelope-safety.json';fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,maps:report.maps.map(m=>({file:m.file,objects:m.objectCount,eligible:m.sourceMatches,outcomes:m.possibleTemplateOutcomes})),output}));}

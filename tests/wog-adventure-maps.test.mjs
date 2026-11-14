import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('Published solo and online adventures retain objectives and give both kingdoms all29 source banks, Caves and guarded flight access',()=>{
 const result=execFileSync('python3',['-c',String.raw`
import json,zipfile,importlib.util,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('maps','scripts/build-wog-adventure-maps.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
for report in json.loads(Path('outputs/wog-adventure-maps/placements.json').read_text()):
 with zipfile.ZipFile(m.MAP_OUTPUT_ROOT/report['map'])as z:h=json.loads(z.read('header.json'));objects=json.loads(z.read('objects.json'));terrain=json.loads(z.read('surface_terrain.json'))
 with zipfile.ZipFile('maps/'+report['source'])as z:old=json.loads(z.read('objects.json'));original=json.loads(z.read('header.json'))
 assert h['players']==original['players']
 assert any(x['modId']=='tum-era' for x in h['mods'])
 retained={o['instanceName']:o for o in objects}
 for o in old:
  if o['type']not in ['core:oakTrees','core:rock']:assert retained[o['instanceName']]==o
 banks=[o for o in objects if o['instanceName'].startswith('wogBank')];assert len(banks)==58
 forts=[o for o in objects if o['type']=='core:hillFort'];assert len(forts)==2
 assert forts[0]['x']+forts[1]['x']==forts[0]['y']+forts[1]['y']==143
 size=h['mapLevels']['surface']['width'];blocked=set().union(*(m.cells(o)for o in objects))
 blocked|={(x,y)for y,row in enumerate(terrain)for x,tile in enumerate(row)if tile[:2]in ['wt','rk']}
 for side,start in enumerate([(17,18),(size-18,size-17)]):
  routes=m.reachable(size,blocked,start)
  assert sorted(p['bank']for p in report['banks']if p['side']==side)==sorted(m.BANKS)
  for p in report['banks']+report['hillForts']+report['mysteriousCaves']+report['flightCaches']:
   if p['side']==side:
    assert p.get('requiresFlight',False)==(p['bank']in [66,67])
    if not p.get('requiresFlight',False):assert tuple(p['approach'])in routes
 caches=[o for o in objects if o['instanceName'].startswith('wogFlightCache')];assert len(caches)==2
 for cache in caches:
  assert cache['type']=='core:artifact' and cache['subtype']=='core:angelWings'
  assert cache['options']['guards']==[{'type':'core:royalGriffin','amount':20}]
 assert len([o for o in objects if o['type']=='tum-era:mysteriousCave'])==2
 assert report['conservativeRecruitmentBfs']
 sites=[o for o in objects if o['instanceName'].startswith('wogRecruit_')];assert len(sites)==76
 assert len({o['instanceName'] for o in objects})==len(objects)
 for side in [0,1]:
  rows=[p for p in report['recruitment'] if p['side']==side]
  assert len(rows)==38 and sum(p['kind']=='original-probabilistic-source' for p in rows)==5
 # Rebuild with all alternative footprints reserved; the published bytes must be reproducible.
 published=m.MAP_OUTPUT_ROOT/report['map'];saved=m.MAP_OUTPUT_ROOT
 with tempfile.TemporaryDirectory() as tmp:
  m.MAP_OUTPUT_ROOT=Path(tmp);m.build(report['source'],report['map'],'Online' in report['source'])
  assert (Path(tmp)/report['map']).read_bytes()==published.read_bytes()
 m.MAP_OUTPUT_ROOT=saved
 for id in m.BANKS:
  a,b=[o for o in banks if o['subtype']=='tum-era:eraBank'+str(id)]
  assert a['x']+b['x']==a['y']+b['y']==size-1
  assert a['template']==b['template']
  for bank in [a,b]:
   footprint=m.cells(bank,'ABTV')
   assert all(not(footprint&m.cells(o,'ABTV'))for o in objects if o is not bank)
 print(report['map'],'verified')
`],{encoding:'utf8'});
 assert.equal(result.trim().split('\n').length,2);
});

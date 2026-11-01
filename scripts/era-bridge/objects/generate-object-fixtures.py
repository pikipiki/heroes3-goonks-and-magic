"""Build real VCMI maps for isolated browser tests; no saves are inputs."""
from pathlib import Path
import json,zipfile,sys,copy
project=Path(sys.argv[1]);stage=Path(sys.argv[2]);out=Path(sys.argv[3]);mod_id=sys.argv[4] if len(sys.argv)>4 else 'tum-era'
out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(project/'maps/000-Goonk.vmap')as z:base={n:z.read(n) for n in z.namelist()}
base_header=json.loads(base['header.json']);base_objects=json.loads(base['objects.json']);report=json.loads((stage/'import-report.json').read_text());cases=[]
for item in report['compiled']:
 config=json.loads((stage/item['config']).read_text());group=next(iter(config));type_id,definition=next(iter(config[group]['types'].items()));definition=item.get('fixtureDefinition',definition);template=copy.deepcopy(next(iter(definition['templates'].values())))
 visit=[]
 for y,line in enumerate(template['mask']):
  for x,char in enumerate(line):
   if char in 'AT':visit.append((len(line)-1-x,len(template['mask'])-1-y))
 if len(visit)!=1:raise ValueError('Fixture requires one source visit square')
 dx,dy=visit[0];target={'type':group,'subtype':item.get('reusesNativeType',type_id if ':' in type_id else mod_id+':'+type_id),'instanceName':'eraBridgeFixtureTarget','x':13+dx,'y':11+dy,'l':0,'template':template,'options':{}}
 objects=[copy.deepcopy(o) for o in base_objects if o['instanceName']in ['goonkTown','goonkHero','enemyTown']]
 hero=next(o for o in objects if o['instanceName']=='goonkHero');hero['options']['type']='core:christian';hero['options']['army']=[{'type':'core:blackDragon','amount':500}];objects.append(target)
 header=copy.deepcopy(base_header);header['name']='TUM Bridge Fixture '+item['kind']+'-'+item['id'];header['description']='Isolated native object integration fixture: '+definition['name'];header['difficulty']='EASY'
 if not any(m.get('modId')==mod_id for m in header.get('mods',[])):header.setdefault('mods',[]).append({'modId':mod_id,'name':'TUM ERA bridge','version':'0.1.0'})
 contents={n:data for n,data in base.items() if n not in ['header.json','objects.json','surface_terrain.json']};contents.update({'header.json':json.dumps(header).encode(),'objects.json':json.dumps(objects).encode(),'surface_terrain.json':json.dumps([['gr49_' for x in range(36)]for y in range(36)]).encode()})
 filename='TUM-'+item['kind']+'-'+item['id']+'.vmap'
 with zipfile.ZipFile(out/filename,'w',zipfile.ZIP_DEFLATED)as z:
  for name,data in contents.items():info=zipfile.ZipInfo(name,(2026,11,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data)
 cases.append({'map':filename,'name':header['name'],'kind':item['kind'],'sourceId':item['id'],'targetSubtype':target['subtype'],'targetVisitablePosition':{'x':13,'y':11,'l':0},'targetAnchorPosition':{'x':target['x'],'y':target['y'],'l':0},'expectedDefinition':definition})
(out/'fixture-cases.json').write_text(json.dumps({'modId':mod_id,'activation':'Maps only: parent browser test loads staged content in its isolated filesystem. No installation modified.','cases':cases},indent=2)+'\n')
print(json.dumps({'maps':len(cases),'output':str(out)}))

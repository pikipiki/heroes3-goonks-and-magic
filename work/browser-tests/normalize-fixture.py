"""Normalize only a throwaway VMAP fixture; no production mutations.
Usage: python3 normalize-fixture.py INPUT.vmap OUTPUT.vmap
Requires a fresh output. Instance-name references in header/objects update together.
Does NOT change arbitrary localization keys, object keys, creature IDs or mods.
"""
import json,zipfile,sys,pathlib
source,destination=map(pathlib.Path,sys.argv[1:]);assert source.resolve()!=destination.resolve();assert not destination.exists()
with zipfile.ZipFile(source)as z:
 objects=json.loads(z.read('objects.json'))
 mapping={obj['instanceName']:obj['instanceName']+'_'+str(index)for index,obj in enumerate(objects)if'instanceName'in obj and not(obj['instanceName'].rsplit('_',1)[-1].isdigit())}
 def update(value):
  if isinstance(value,str):return mapping.get(value,value)
  if isinstance(value,list):return[update(v)for v in value]
  if isinstance(value,dict):return{mapping.get(k,k):update(v)for k,v in value.items()}
  return value
 names=[mapping.get(o['instanceName'],o['instanceName'])for o in objects if 'instanceName'in o]
 assert len(names)==len(set(names)), 'Fixture instance-name collision'
 with zipfile.ZipFile(destination,'x',zipfile.ZIP_DEFLATED)as out:
  for name in z.namelist():
   data=z.read(name)
   if name in['objects.json','header.json']:data=json.dumps(update(json.loads(data)),ensure_ascii=False).encode("utf8")
   out.writestr(name,data)
print(json.dumps({'instanceNameChanges':mapping}))

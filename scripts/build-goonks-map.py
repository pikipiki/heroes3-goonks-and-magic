"""Build the deterministic, symmetric Goonks XL duel. No saved games are inputs."""
from pathlib import Path
import json, random, zipfile
ROOT=Path(__file__).resolve().parents[1]
N=144
rng=random.Random(71031)
templates=json.loads((ROOT/'scripts/goonks-map-templates.json').read_text())
factions=['core:'+name for name in ['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux']]+['goonk:goonk']
header={'versionMajor':3,'versionMinor':0,'name':'Goonks','description':'Duel XL pour un humain et un ordinateur. Deux royaumes symétriques, six villes neutres, des forêts, des carrières et des gardes. Château Goonk présélectionné ; choisissez votre faction avant de commencer. Victoire : vaincre votre adversaire.','difficulty':'NORMAL','mapLevels':{'surface':{'width':N,'height':N,'index':0,'layer':'core:surface'}},'players':{},'mods':[{'modId':'goonk','name':'Château Goonk','version':'0.3.0'}]}
objects=[];occupied=set();reserved=set()
def mirror(p):return (N-1-p[0],N-1-p[1])
def area(x,y,r=4):return {(a,b) for a in range(x-r,x+r+1) for b in range(y-r,y+r+1)}
# Reserve wide travel corridors and clearings. Every objective remains connected.
for x in range(N):
 for y in range(N):
  if abs(y-x)<5 or abs(y-(N-1-x))<4 or abs(x-71)<3 or abs(y-71)<3:reserved.add((x,y))
places=[(17,17),(126,126),(43,28),(100,115),(27,88),(116,55),(67,47),(76,96)]
for x,y in places:reserved|=area(x,y,9)
def add(kind,sub,x,y,animation,options=None,name=None):
 template=templates[animation]
 if kind in ['town','randomTown']:options={**(options or {}),'possibleSpells':list(json.loads((ROOT/'mod/goonk/Content/config/spell-chances.json').read_text()))}
 obj={'type':'core:'+kind,'subtype':sub,'instanceName':name or 'goonksObject'+str(len(objects)),'x':x,'y':y,'l':0,'template':template,'options':options or {}}
 objects.append(obj)
 for iy,row in enumerate(template['mask']):
  for ix,char in enumerate(row):
   if char in 'AB':occupied.add((x-(len(row)-1-ix),y-(len(template['mask'])-1-iy)))
 return obj
for color,location,can in [('red',(17,17),'PlayerOnly'),('blue',(126,126),'AIOnly')]:
 x,y=location
 header['players'][color]={'canPlay':can,'allowedFactions':{'anyOf':factions},'randomFaction':True,'mainTown':{'x':x,'y':y,'l':0,'generateHero':True}}
 add('randomTown','core:object',x,y,'AVCranx0.def',{'owner':color,'name':'Goonkbourg' if color=='red' else 'Bastion du rival','hasFort':True},color+'Home')
for i,(x,y) in enumerate(places[2:]):
 add('randomTown','core:object',x,y,'AVCranx0.def',{'owner':'neutral','name':['Clairière des peluches','Bois du crépuscule','Roc-DioupDioup','Val de Bubu','Les Braises','Haut-Paingpaing'][i],'hasFort':True,'army':[{'type':'core:pikeman','amount':25}]})
# Each side has the same seven mines and starter supplies.
mines=[('sawmill','AVMsawg0.def',-5,8),('orePit','AVMore0.def',8,5),('goldMine','AVMgold0.def',13,17),('crystalCavern','AVMcrys0.def',21,5),('gemPond','AVMgems0.def',7,25),('alchemistLab','AVMalch0.def',25,16),('sulfurDune','AVMsulf0.def',18,28)]
for side in [0,1]:
 for sub,anim,dx,dy in mines:
  if anim not in templates:continue
  x,y=(17+dx,17+dy)
  if side:x,y=mirror((x,y))
  reserved|=area(x,y,5)
  add('mine','core:'+sub,x,y,anim,{'owner':'neutral'})
 for i,(sub,anim) in enumerate([('wood','AVTwood0.def'),('ore','AVTore0.def'),('gold','AVTgold0.def'),('crystal','AVTcrys0.def'),('gems','AVTgems0.def'),('mercury','AVTmerc0.def'),('sulfur','AVTsulf0.def')]):
  x,y=(13+i*2,21+i%2*3)
  if side:x,y=mirror((x,y))
  reserved|=area(x,y,2);add('resource','core:'+sub,x,y,anim,{'amount':1000 if sub=='gold' else 8})
# Paired exploration rewards and progressively stronger wandering guards.
for i in range(72):
 x,y=rng.randint(9,67),rng.randint(8,135)
 if (x,y) in occupied or any(abs(x-a)<8 and abs(y-b)<8 for a,b in places):continue
 sub,anim=rng.choice([('gold','AVTgold0.def'),('wood','AVTwood0.def'),('ore','AVTore0.def')])
 for a,b in [(x,y),mirror((x,y))]:
  reserved|=area(a,b,2)
  # Draw the pair's resource and quantity identically.
  add('resource','core:'+sub,a,b,anim,{'amount':1500 if sub=='gold' else 10})
# Each guard is paired with the same creature and stack size.
# Use the verified showcase monster templates rather than guessing mod sprite paths.
with zipfile.ZipFile(ROOT/'maps/000-Goonk.vmap') as z:showcase=json.loads(z.read('objects.json'))
guardTemplate=next(o['template'] for o in showcase if o.get('instanceName')=='trainingGuard')
for i in range(28):
 x,y=rng.randint(30,66),rng.randint(10,133)
 if (x,y) in occupied or (x,y) in reserved:continue
 count=12+int(((x-17)**2+(y-17)**2)**.5/4)
 for a,b in [(x,y),mirror((x,y))]:
  objects.append({'type':'core:monster','subtype':'goonk:paingpaing','instanceName':'guard'+str(len(objects)),'x':a,'y':b,'l':0,'template':guardTemplate,'options':{'amount':count,'character':'savage','neverFlees':True}})
  occupied.add((a,b));reserved|=area(a,b,3)
# Native choice objects are paired and their full footprints remain clear.
from importlib.util import spec_from_file_location, module_from_spec
adventure_spec=spec_from_file_location('goonk_adventures',ROOT/'scripts/place-adventure-objects.py')
adventures=module_from_spec(adventure_spec);adventure_spec.loader.exec_module(adventures)
adventures.place_adventures(objects,N)
for obj in objects:
 if obj['instanceName'].startswith('goonkAdventure'):reserved|=area(obj['x'],obj['y'],5)
# Groves and rock outcrops use the original Heroes III footprints. Keep corridors clear.
for i in range(2200):
 x,y=rng.randint(9,70),rng.randint(7,136)
 if rng.random()>.62:continue
 anim=rng.choice(['AVLSPTR0.def','AVLSPTR1.def','AVLr02r0.def'])
 if anim not in templates:continue
 cells={(x-dx,y-dy) for dx in range(5) for dy in range(3)}
 if cells&(reserved|occupied):continue
 other={mirror(c) for c in cells}
 if other&(reserved|occupied):continue
 for a,b in [(x,y),mirror((x,y))]:add('rock' if anim.startswith('AVLr') else 'oakTrees','core:object',a,b,anim)
# Full grass interior tiles (49–72), paired texture variations, no broken coast seams.
terrain=[['' for x in range(N)] for y in range(N)]
for y in range(N):
 for x in range(N):
  if terrain[y][x]:continue
  tile='gr'+str(rng.randint(49,72))+'_';terrain[y][x]=tile;terrain[N-1-y][N-1-x]=tile
translations={'mapName':'Goonks'}
for o in objects:
 if 'name' in o['options']:translations[o['options']['name']]=o['options']['name']
contents={'header.json':header,'objects.json':objects,'surface_terrain.json':terrain,'english.json':translations,'french.json':translations}
# Stable zip metadata keeps repeated builds byte-identical.
with zipfile.ZipFile(ROOT/'maps/001-Goonks.vmap','w',zipfile.ZIP_DEFLATED) as z:
 for name,value in contents.items():
  info=zipfile.ZipInfo(name,(2026,10,31,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,json.dumps(value,ensure_ascii=False,separators=(',',':')).encode())
print(json.dumps({'map':'Goonks','size':[N,N],'players':2,'objects':len(objects)}))

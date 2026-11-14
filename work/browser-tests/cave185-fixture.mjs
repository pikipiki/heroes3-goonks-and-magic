import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';import {convertObjectTemplate} from '../../scripts/era-bridge/objects/objects.mjs';
const archive=readEraArchive(fs.readFileSync('work/downloads/wog-port185/root/hmm35wog.pac'));
const rows=archive.extract('zobjcts.txt').toString('latin1').split(/\r?\n/);
const template=(type,subtype=0)=>{const row=rows.find(line=>{const p=line.trim().split(/\s+/);return p.length===9&&+p[5]===type&&+p[6]===subtype;});if(!row)throw Error('No original template '+type+':'+subtype);const name=row.trim().split(/\s+/)[0];const mask=name.replace(/\.def$/i,'.msk');return convertObjectTemplate(row,archive.names.some(n=>n.toLowerCase()===mask.toLowerCase())?{maskBytes:archive.extract(mask)}:{}).template;};
export function caveFixture(options={}){
 const candidate=process.env.CAVE185_CANDIDATE||'/tmp/goonk-cave185-candidate-final';
 const cave=JSON.parse(fs.readFileSync(candidate+'/content/config/objects/mysterious-cave.json')).mysteriousCave.types.mysteriousCave.templates.default;
 const extras=[{type:'tum-era:mysteriousCave',subtype:'tum-era:mysteriousCave',name:'sourceCave',at:[13,11],template:cave,options:{}},
 {type:'core:resource',subtype:'core:gold',name:'fixtureGold',at:[12,11],template:template(79,6),options:{amount:1000000}},
 ...[[23,'marlettoTower'],[32,'gardenOfRevelation'],[51,'mercenaryCamp'],[61,'starAxis'],[41,'libraryOfEnlightenment'],[4,'arena'],[47,'schoolOfMagic']].map(([id,name],i)=>({type:'core:'+name,subtype:'core:'+name,name:'remote'+id,at:[20+i*2,18],template:template(id),options:{}})),
 {type:'core:obelisk',subtype:'core:object',name:'remoteObelisk',at:[20,21],template:template(57),options:{}}];
 if(options.remote){for(let i=extras.length-1;i>=0;i--)if(/^remote\d+$/.test(extras[i].name))extras.splice(i,1);const [id,name]=[[23,'marlettoTower'],[32,'gardenOfRevelation'],[51,'mercenaryCamp'],[61,'starAxis'],[41,'libraryOfEnlightenment'],[4,'arena'],[47,'schoolOfMagic']][options.remote-1];for(const[suffix,at]of[['A',[16,15]],['B',[22,15]]])extras.push({type:'core:'+name,subtype:'core:'+name,name:'remoteControl'+suffix,at,template:template(id),options:{}});}
 return execFileSync('python3',['-c',`import zipfile,json,sys,io,importlib.util
extras=json.loads(sys.argv[1]);opts=json.loads(sys.argv[2])
with zipfile.ZipFile('maps/000-Goonk.vmap')as z:e={n:z.read(n)for n in z.namelist()}
objects=[o for o in json.loads(e['objects.json'])if o['instanceName']in ['goonkTown','goonkHero','enemyTown']]
hero=next(o for o in objects if o['instanceName']=='goonkHero');hero['options'].update({'type':'core:christian','army':[{'type':'core:blackDragon','amount':500}],'artifacts':{'shoulders':'core:angelWings'}})
if opts.get('remote'):hero['options']['experience']=1000000
if opts.get('grail'):
 town=next(o for o in objects if o['instanceName']=='goonkTown');town['options']['buildings']['allOf']+=['goonk:grail']
if opts.get('extendedTown'):
 town=next(o for o in objects if o['instanceName']=='goonkTown');town['options']['buildings']['allOf']+=['goonk:dwellingLvl7','goonk:dwellingUpLvl7','goonk:dwellingUp2Lvl7','goonk:dwellingUp3Lvl7']
for c in extras:
 mask=c['template']['mask'];v=[(len(line)-1-x,len(mask)-1-y)for y,line in enumerate(mask)for x,ch in enumerate(line)if ch in 'AT'];assert len(v)==1,(c['name'],v);dx,dy=v[0]
 objects.append({'type':c['type'],'subtype':c['subtype'],'instanceName':c['name'],'x':c['at'][0]+dx,'y':c['at'][1]+dy,'l':0,'template':c['template'],'options':c['options']})
if opts.get('scourgeApproach'):
 import copy
 hero['options']['type']='core:valeska'
 target=copy.deepcopy(hero);target.update({'instanceName':'scourgeTarget','x':16,'y':11});target['options'].update({'type':'core:christian','owner':'green','army':[{'type':'core:blackDragon','amount':10}]});objects.append(target)
 home=copy.deepcopy(next(o for o in objects if o['instanceName']=='enemyTown'));home.update({'instanceName':'greenTown','x':10,'y':29});home['options'].update({'owner':'green','name':'Scourge target town'});objects.append(home)
objects.append({'type':'core:monster','subtype':'core:pikeman','instanceName':'neutralControl','x':20,'y':11,'l':0,'template':{'animation':'AVWpikX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':20,'character':'savage','neverFlees':True}})
e['objects.json']=json.dumps(objects).encode();h=json.loads(e['header.json']);h['name']='000 - Native Cave source validation'
if opts.get('scourgeApproach'):
 h['players']['green']={'canPlay':'PlayerOnly','allowedFactions':{'anyOf':['core:castle']},'mainTown':{'x':10,'y':29,'l':0,'generateHero':False},'mainHero':'scourgeTarget'}
 if opts['scourgeApproach'].get('allied'):h['teams']=[['red','green'],['blue']]
if opts.get('poolOnly'):h['allowedHeroes']={'anyOf':['core:christian','core:valeska']}
e['header.json']=json.dumps(h).encode()
for lang in ['english.json','french.json']:
 t=json.loads(e[lang]);t['mapName']=h['name'];e[lang]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);e=n.normalize(e);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)as z:
 for name,data in e.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(extras),JSON.stringify(options)]);
}

"""Add the native Goonk choice objects without replacing existing map content."""
from pathlib import Path
import json,zipfile
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'mod/goonk/Content/config/adventure-objects.json').read_text())

def adventure_object(kind,x,y,name):
    template=CONFIG[kind]['types'][kind]['templates']['normal']
    return {'type':'goonk:'+kind,'subtype':'goonk:'+kind,'instanceName':name,'x':x,'y':y,'l':0,'template':template,'options':{}}

def place_adventures(objects,size):
    if size==36:
        positions=[('adventureCache',8,14),('adventureAcademy',7,18),('adventureWorkshop',17,10)]
    elif size==144:
        positions=[('adventureCache',21,19),('adventureAcademy',23,16),('adventureWorkshop',15,20)]
        positions += [(kind,143-x,143-y) for kind,x,y in positions.copy()]
    else: raise ValueError('Only the two authored Goonk maps are supported')
    names={obj['instanceName'] for obj in objects}
    for index,(kind,x,y) in enumerate(positions):
        name='goonkAdventure'+str(index)
        if name not in names: objects.append(adventure_object(kind,x,y,name))
    return objects

if __name__=='__main__':
    for name,size in [('000-Goonk.vmap',36),('001-Goonks.vmap',144)]:
        file=ROOT/'maps'/name
        with zipfile.ZipFile(file) as src: entries={n:src.read(n) for n in src.namelist()}
        objects=json.loads(entries['objects.json']);place_adventures(objects,size)
        entries['objects.json']=json.dumps(objects,ensure_ascii=False,separators=(',',':')).encode()
        with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as dst:
            for n,data in entries.items():
                info=zipfile.ZipInfo(n,(2026,11,12,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;dst.writestr(info,data)

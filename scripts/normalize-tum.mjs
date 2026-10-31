import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve('work/browser-tests/package.json')),JSON5=require('json5');
const read=p=>JSON5.parse(fs.readFileSync(p,'utf8')),write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
export function normalizeTum(){
 const root='mod/third-upgrades';
 const meta=read(root+'/mod.json');meta.settings.combat={badLuckChance:[2,4,6]};write(root+'/mod.json',meta);
 for(const f of ['book','summoner_book']){const p=root+'/content/config/artifacts/'+f+'.json',o=read(p);for(const a of Object.values(o)){a.graphics.scenarioBonus=a.graphics.bonus;delete a.graphics.bonus;if(Array.isArray(a.bonuses))a.bonuses=Object.fromEntries(a.bonuses.map((b,i)=>['bonus'+i,b]));}write(p,o);}
 const spells=root+'/content/config/spells/summons_book.json',sp=read(spells);for(const spell of Object.values(sp))for(const level of Object.values(spell.levels||{}))delete level.aiValue;write(spells,sp);
 const dwelling=root+'/Mods/wog-comp/content/config/dwellings/sylvanStables.json';write(dwelling,{'core:creatureGeneratorCommon':{'types':{'sylvanHomestead':{'creatures':[['centaurArcher']]}}}});
 const heroes=root+'/content/config/heroes/heroes_fix.json';write(heroes,read(heroes));
 const dragon='mod/tum-era/content/config/red-bones-dragon.json',cr=read(dragon);for(const a of Object.values(cr.redBonesDragon.abilities))delete a.icon;write(dragon,cr);
}
if(path.resolve(process.argv[1]||'').endsWith('/normalize-tum.mjs'))normalizeTum();

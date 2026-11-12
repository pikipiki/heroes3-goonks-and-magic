/** Translate the complete original enemy morale/luck artifact hooks to native
 * battle-wide bonuses with OPPOSITE_SIDE. No native script interpreter needed.
 * The overlay is isolated until actual battle controls pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon} from './importer.mjs';

export const opponentArtifacts=Object.freeze({
  183:{MORALE:-2},184:{LUCK:-2},185:{LUCK:-1},186:{MORALE:-1},
  187:{LUCK:-1},188:{MORALE:-1},249:{LUCK:-3},250:{MORALE:-2},252:{MORALE:-3,LUCK:-3},
});
export function opponentArtifactBonuses(id){
  const values=opponentArtifacts[id];if(!values)throw Error('Unreviewed source opponent artifact');
  return Object.fromEntries(Object.entries(values).map(([type,val])=>['sourceOpponent'+type,{type,val,valueType:'ADDITIVE_VALUE',stacking:'tum-source-opponent-artifact-'+id,propagator:'BATTLE_WIDE',propagationUpdater:'BONUS_OWNER_UPDATER',limiters:['OPPOSITE_SIDE']}]));
}
export function importOpponentArtifacts(project,source,output){
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
 if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Original morale/luck hook program changed');
 const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
 if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Original artifact archive changed');
 if(output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('Fresh isolated output required');
 const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1'));
 const language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
 const icons=archive.extract('artifact.def'),definitions={};
 const write=(file,data)=>{const p=path.join(output,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');};
 for(const id of Object.keys(opponentArtifacts).map(Number)){
  if(fs.existsSync(path.join(source,'Data/artifacts',id+'.cfg')))throw Error('Source artifact now has additional CFG obligations '+id);
  const trait=traits[id],icon=decodeArtifactIcon(icons,id),stem='ava'+String(id).padStart(4,'0');
  if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity mismatch');
  const assets='tum-era/artifacts/'+id;
  const map=archive.extract(stem+'.def'),mask=archive.extract(stem+'.msk');
  definitions['artifact'+id]={type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,
   text:normalizeArtifactLanguage(trait,language[id]).text,
   graphics:{image:assets+'/icon.png',map:assets+'/map.def',scenarioBonus:assets+'/scenario.png'},bonuses:opponentArtifactBonuses(id)};
  write('content/Sprites/'+assets+'/map.def',map);write('content/Sprites/'+assets+'/map.msk',mask);
  write('content/Data/'+assets+'/icon.png',encodePng(icon));write('content/Data/'+assets+'/scenario.png',encodePng(scenarioIcon(icon)));
 }
 write('content/config/opponent-artifacts.candidate.json',definitions);
 write('opponent-artifacts-source.json',{artifactIds:Object.keys(opponentArtifacts).map(Number),scriptSHA256:sha(script),archiveSHA256:archive.sha256,
  sourceFunctions:['tum_MinusMorale','tum_MinusLuck'],sourceScope:'Third Upgrade Mod.erm enemy hero equipped checks, one subtraction per artifact identity; source ids183..188,249,250,252',
  nativeCarrier:'MORALE/LUCK ADDITIVE_VALUE, BATTLE_WIDE propagator and OPPOSITE_SIDE limiter',
  pending:['Native controls: enemy versus own stacks, equip/backpack, both heroes, additive artifacts, unaffected map stats, save/load'],activationReady:false});
 return definitions;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
 if(!output)throw Error('Usage: import-opponent-morale-luck.mjs PROJECT SOURCE FRESH_OUTPUT');
 importOpponentArtifacts(project,source,output);console.log('Prepared nine complete original opponent artifacts.');
}

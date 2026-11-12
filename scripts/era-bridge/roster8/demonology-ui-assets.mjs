/** Existing Resurrection icons reused for Demonology UI; no combat art altered. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import{readEraArchive}from'../resources.mjs';import{decodeDefFrame}from'./def-frame.mjs';import{encodePng}from'../artifacts/importer.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const DEMONOLOGY_UI_GRAPHICS=Object.fromEntries(['Book','Effect','ScenarioBonus','Scroll'].map(kind=>['icon'+kind,'tum-era/demonology/resurrection-'+kind.toLowerCase()+'.png']));
export function prepareDemonologyUI(project,out){
 const root=path.join(project,'game-data'),manifest=JSON.parse(fs.readFileSync(root+'/manifest.json')),file=manifest.files.find(f=>f.path==='Data/H3sprite.lod');if(!file)throw Error('Verified original sprite archive required');
 const bytes=Buffer.concat(file.chunks.map(c=>{const b=fs.readFileSync(root+'/chunks/'+c.hash+'.bin');if(b.length!==c.size||sha(b)!==c.hash)throw Error('Corrupted original sprite chunk');return b;}));if(bytes.length!==file.size||sha(bytes)!==file.hash)throw Error('Corrupted original sprite archive');
 const archive=readEraArchive(bytes),files=[];
 for(const[kind,def,frame]of[['Book','spells.def',38],['Effect','spellint.def',39],['ScenarioBonus','spellbon.def',38],['Scroll','spellscr.def',38]]){
  const source=archive.extract(def),png=encodePng(decodeDefFrame(source,frame)),name='content/Sprites/'+DEMONOLOGY_UI_GRAPHICS['icon'+kind],target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,png);files.push({path:name,sha256:sha(png),source:def,sourceFrame:frame,sourceDefSha256:sha(source)});
 }
 return {purpose:'UI reuse of original Resurrection38 icons only; Demonology animations/sounds/mechanics unchanged',archiveSha256:archive.sha256,files};
}

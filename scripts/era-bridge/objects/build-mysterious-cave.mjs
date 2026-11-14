import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {readEraArchive} from '../resources.mjs';
import {convertObjectTemplate} from './objects.mjs';
import {inspectMysteriousCave} from './mysterious-cave.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export function prepareMysteriousCave({sourceBytes,stockArchiveBytes}){
 const contract=inspectMysteriousCave(sourceBytes),archive=readEraArchive(stockArchiveBytes);
 const text=archive.extract('zobjcts.txt').toString('latin1');
 const files=new Map(),templates={};
 for(const [sourceSubtype,animation]of [[55,'zyzop1.def'],[56,'zyzop2.def']]){
  const matching=text.split(/\r?\n/).filter(line=>{const p=line.trim().split(/\s+/);return p.length===9&&Number(p[5])===63&&Number(p[6])===sourceSubtype;});
  assert.equal(matching.length,1,'Exact original Cave template required');
  assert.equal(matching[0].split(/\s+/)[0].toLowerCase(),animation);
  const maskBytes=archive.extract(animation.replace('.def','.msk'));
  const parsed=convertObjectTemplate(matching[0],{maskBytes,animationPrefix:'tum-era/objects/'});
  // Preserve original filename spelling only in the source record. Native resource URLs are case-normalized.
  parsed.template.animation='tum-era/objects/'+animation;
  templates[sourceSubtype]={...parsed.template};
  files.set('content/Sprites/tum-era/objects/'+animation,archive.extract(animation));
  files.set('content/Sprites/tum-era/objects/'+animation.replace('.def','.msk'),maskBytes);
 }
 assert.deepEqual(templates[55].mask,templates[56].mask);
 assert.deepEqual(templates[55].visitableFrom,templates[56].visitableFrom);
 // CD uses these original faction-specific damage/ruin map animations.
 for(const faction of ["cast","ramp","towr","infr","necr","dung","strn","fort","conf"])
  for(let damage=1;damage<=4;damage++)for(const extension of ["def","msk"]){
   const name=`avc${faction}${damage}.${extension}`;files.set("content/Sprites/tum-era/objects/"+name,archive.extract(name));
  }
 const type=initiallyVisited=>({name:'Mysterious Cave',description:'A weekly encounter. Some discoveries grant gifts; merchants and the Builder role ask for confirmation.',eraMysteriousCave:true,
  blockedVisitable:false,visitMode:'unlimited',selectMode:'selectFirst',canRefuse:false,rewards:[{}],
  variables:{number:{caveAllOpen:0,caveWatcher:0,caveInitiallyVisited:initiallyVisited?15:0}},
  templates:{default:templates[initiallyVisited?55:56]}});
 const definition={mysteriousCave:{name:'Mysterious Cave',handler:'configurable',types:{mysteriousCave:type(false),mysteriousCaveVisited:type(true)}}};
 files.set('content/config/objects/mysterious-cave.json',Buffer.from(JSON.stringify(definition,null,2)+'\n'));
 return {files,definition,source:{scriptSha256:sha(sourceBytes),stockArchiveSha256:sha(stockArchiveBytes),templateMember:'zobjcts.txt',templates:[55,56].map(subtype=>({sourceObjectType:63,sourceSubtype:subtype,template:templates[subtype]}))},contract,activation:false,nativeValidated:false,
  identityBindings:{'63:56':{group:'tum-era:mysteriousCave',type:'tum-era:mysteriousCave'},'63:55':{group:'tum-era:mysteriousCave',type:'tum-era:mysteriousCaveVisited'}},
  requiredBeforeActivation:['CGMysteriousCave factory/serialization/hook build','Source all-reward native branch coverage','Builder demolition/re-faction and specialty restoration','Scourge approach/expiry','Shared RNG and clocks across human/AI turns','Four mobile viewports and original save controls']};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const[source,stock,output]=process.argv.slice(2);if(!source||!stock||!output)throw Error('SOURCE_ERM STOCK_ARCHIVE FRESH_OUTPUT required');if(fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Fresh output required');const result=prepareMysteriousCave({sourceBytes:fs.readFileSync(source),stockArchiveBytes:fs.readFileSync(stock)});for(const[relative,bytes]of result.files){const f=path.join(output,relative);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,bytes);}fs.writeFileSync(path.join(output,'mysterious-cave-source.json'),JSON.stringify({...result,files:[...result.files].map(([file,bytes])=>({file,bytes:bytes.length,sha256:sha(bytes)}))},null,2)+'\n');}

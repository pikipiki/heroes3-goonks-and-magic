/** Consolidate completed real-engine cases; partial or missing evidence is rejected. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {SOURCE_OBLIVION_CONTRACT,validateOblivionEvidence} from './oblivion.mjs';
const[review,revivalPath,necromancyPath,sacrificePath,geometryPath,clonePath,cachePath,output]=process.argv.slice(2);
if(!output)throw Error('REVIEW REVIVAL_JSON NECROMANCY_JSON SACRIFICE_JSON GEOMETRY_JSON CLONE_JSON CACHE_JSON OUTPUT required');
const read=p=>JSON.parse(fs.readFileSync(p)),controls={};
const add=(name,result,record)=>{if(result.passed!==true||!record)throw Error('Missing successful case '+name);controls[name]={passed:true,engineSHA256:result.engineSHA256,observed:record};};
const revival=read(revivalPath),necro=read(necromancyPath),sacrifice=read(sacrificePath),geometry=read(geometryPath),clones=read(clonePath),cache=read(cachePath);
for(const mode of['equipped','backpack'])for(const id of[38,39])add('revival-'+mode+'-'+id,revival,revival.report[mode+'-'+id]);
for(const mode of['baseline','equipped','backpack','enemy','both'])add('necromancy-'+mode,necro,necro.report['necromancy-'+mode]);
for(const mode of['equipped','backpack']){add('sacrifice-'+mode,sacrifice,sacrifice.report['sacrifice-'+mode]);add('clone-'+mode,clones,clones.report[mode]);}
for(const kind of['single','double'])add('geometry-'+kind,geometry,geometry.report[kind]);
if(cache.report.firstBattleRaised!==0||!(cache.report.secondBattleRaised>0)||cache.report.ringInBackpack!==true)throw Error('Actual second battle after unequipping required');
add('result-cache-cleared',cache,cache.report);
const definition=read(review+'/content/config/oblivion.candidate.json');
const proof=validateOblivionEvidence({passed:true,contract:SOURCE_OBLIVION_CONTRACT,definitionSHA256:crypto.createHash('sha256').update(JSON.stringify(definition)).digest('hex'),controls,pendingNativeControls:[],limitations:['Original source TODO to ban Life Drain/Attract Dead Souls is unimplemented; no such prohibition is invented.','Each case records the binary actually tested.']});
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(proof,null,2)+'\n');console.log('All16 original Ring of Oblivion controls validated.');

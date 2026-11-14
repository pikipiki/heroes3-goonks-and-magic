import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {readEraArchive} from '../resources.mjs';
import {parseCreatureExperience} from './crexpbon.mjs';
import {simulateSourceXpCache14} from './source-xp-cache14.mjs';
export const BANK_XP_SPECS=[[272,'p',21],[281,'p',21],[281,'a',22],[289,'a',21],[290,'a',16],[330,'K',13]];
export const BANK_ACTORS=[253,272,281,289,290,301,302,330,340,358];
export const digest=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
export function compileBankXpRows(sourceRoot){
 const bytes=fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.pac'));
 if(digest(bytes)!=='452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c')throw Error('Pinned TUM archive required');
 const archive=readEraArchive(bytes),sourceRows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1'));
 const rows=BANK_XP_SPECS.map(([sourceId,code,spell])=>{
  const candidates=sourceRows.filter(r=>r.creature===sourceId&&r.code===code&&r.modifier==='#'+spell);
  if(candidates.length!==1)throw Error('Unique bank XP source row required');
  const r=candidates[0],own=sourceRows.filter(r=>r.creature===sourceId);
  const cfg=fs.readFileSync(path.join(sourceRoot,'Data/Creatures/'+sourceId+'.cfg'),'utf8');
  const level=Number(cfg.match(/^Level=(\d+)/m)?.[1]);if(!Number.isInteger(level))throw Error('Source level required');
  const cache=simulateSourceXpCache14(sourceRows,{sourceId,zeroBasedLevel:level});
  const slot=cache.table.findIndex(e=>e?.sourceLine===r.line&&e.sourceId===sourceId);
  if(slot<0)throw Error('Bank XP row lost from original cache');
  return{sourceId,nativeId:'tum-era:eraCreature'+sourceId,sourceLine:r.line,sourceOrdinal:own.indexOf(r),cacheSlot:slot,code,spell,chances:r.values};
 });
 return{schemaVersion:1,contract:'source-bank-xp6-v1',archiveSha256:digest(bytes),cohortSha256:digest(rows),rows};
}
export function bankXpHeader(c){return '#pragma once\n#include "EraOrderedExperienceRule.h"\nnamespace era_bridge {\ninline constexpr std::string_view sourceBankXpCohort="'+c.cohortSha256+'";\ninline constexpr std::array<SourceXpProvenance,6> sourceBankXpRows{{\n'+c.rows.map(r=>' {'+r.sourceId+',"'+r.nativeId+'",'+[r.sourceLine,r.sourceOrdinal,r.cacheSlot].join(',')+",'"+r.code+"',"+r.spell+',{{'+r.chances.join(',')+'}},false},').join('\n')+'\n}};\n}\n';}

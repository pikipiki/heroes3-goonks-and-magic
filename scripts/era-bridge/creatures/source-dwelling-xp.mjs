import fs from 'node:fs';
import path from 'node:path';
import {readEraArchive} from '../resources.mjs';
import {parseCreatureExperience} from './crexpbon.mjs';
import {simulateSourceXpCache14} from './source-xp-cache14.mjs';
import {digest} from './source-bank-xp.mjs';
export const DWELLING_XP_SPECS=[[274,'a',60],[276,'p',45],[277,'p',16],[282,'a',60],[284,'p',45],[285,'a',74],[288,'a',16],[288,'p',68],[292,'a',17],[306,'p',52],[312,'a',70],[312,'a',74],[313,'p',14],[314,'p',14],[360,'a',42],[362,'p',25],[362,'a',25]];
export function compileDwellingXpRows(sourceRoot){
 const bytes=fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.pac'));
 if(digest(bytes)!=='452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c')throw Error('Pinned TUM archive required');
 const sourceRows=parseCreatureExperience(readEraArchive(bytes).extract('crexpbon.txt').toString('latin1'));
 const rows=DWELLING_XP_SPECS.map(([sourceId,code,spell])=>{
  const found=sourceRows.filter(r=>r.creature===sourceId&&r.code===code&&r.modifier==='#'+spell);if(found.length!==1)throw Error('Unique dwelling XP row required');
  const r=found[0],own=sourceRows.filter(r=>r.creature===sourceId),cfg=fs.readFileSync(path.join(sourceRoot,'Data/Creatures/'+sourceId+'.cfg'),'utf8'),level=Number(cfg.match(/^Level=(\d+)/m)?.[1]);
  const cache=simulateSourceXpCache14(sourceRows,{sourceId,zeroBasedLevel:level});const slot=cache.table.findIndex(e=>e?.sourceLine===r.line&&e.sourceId===sourceId);if(slot<0)throw Error('Dwelling XP row absent original cache');
  return{sourceId,nativeId:'tum-era:eraCreature'+sourceId,sourceLine:r.line,sourceOrdinal:own.indexOf(r),cacheSlot:slot,code,spell,chances:r.values,existingSourceOwner:false};
 });return{schemaVersion:1,contract:'source-dwelling-xp17-v1',archiveSha256:digest(bytes),cohortSha256:digest(rows),rows};
}
export function dwellingXpHeader(c){return '#pragma once\n#include "EraOrderedExperienceRule.h"\nnamespace era_bridge {\ninline constexpr std::string_view sourceDwellingXpCohort="'+c.cohortSha256+'";\ninline constexpr std::array<SourceXpProvenance,17> sourceDwellingXpRows{{\n'+c.rows.map(r=>' {'+r.sourceId+',"'+r.nativeId+'",'+[r.sourceLine,r.sourceOrdinal,r.cacheSlot].join(',')+",'"+r.code+"',"+r.spell+',{{'+r.chances.join(',')+'}},'+r.existingSourceOwner+'},').join('\n')+'\n}};\n}\n';}

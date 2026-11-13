import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('source specialty levels bind Azure/commanders independently of native levels and preserve unknown Goonks',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source-levels-'));
 try {
  const file=path.join(dir,'x.cpp'),bin=path.join(dir,'x');
  fs.writeFileSync(file,`
#include "EraSourceCreatureLevels.h"
#include "EraFangarmHypnotize.h"
#include <cassert>
using namespace era_bridge;
int main(){
 assert(sourceInitialCreatureLevel(132)==6);
 assert(sourceInitialCreatureLevel(0)==0);
 for(int id=174;id<=191;id++)assert(sourceInitialCreatureLevel(id)==6);
 for(int id:{-1,122,124,126,128,363,1023})assert(!sourceInitialCreatureLevel(id));
 assert(sourceCreatureLevelForKey("core:azureDragon")==6);
 assert(sourceCreatureLevelForKey("wake-of-gods.commanders:paladin1")==6);
 assert(sourceCreatureLevelForKey("wake-of-gods.commanders:astralSpirit1")==6);
 assert(!sourceCreatureLevelForKey("goonk:bubu"));
 assert(sourceSpecialtyTargetTier("core:azureDragon",10)==7);
 assert(sourceSpecialtyTargetTier("wake-of-gods.commanders:paladin1",0)==7);
 assert(sourceSpecialtyTargetTier("goonk:bubu",4)==4);
 assert(!sourceSpecialtyTargetTier("goonk:unobservedLevelZero",0));
 assert(fangarmAstralHypnotizeThreshold(100,7,*sourceSpecialtyTargetTier("core:azureDragon",10))==103);
 assert(fangarmAstralHypnotizeThreshold(100,7,10)==100); // Current native level is observably wrong for the original Azure.
 assert(fangarmAstralHypnotizeThreshold(100,7,*sourceSpecialtyTargetTier("goonk:bubu",4))==103);
 const int expected[8]={3,3,2,2,1,1,0,4};
 for(int i=0;i<8;i++){
  assert(sourceSpecialty45Bonus(i,0)==expected[i]);
  assert(sourceSpecialty45Bonus(i,2)==expected[i]);
  assert(sourceSpecialty45Bonus(i,1)==0);
 }
 assert(!sourceSpecialty45Bonus(-1,0));assert(!sourceSpecialty45Bonus(8,0));
 assert(sourceSpecialty45Bonus(-1,1)==0); // Null hero kind1 never indexes the table.
}
`);
  execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('scripts/era-bridge/creatures/native'),'-I'+path.resolve('work/vcmi-wasm/lib/era'),file,'-o',bin]);
  execFileSync(bin);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('bounded catalog records every observed initialization and excludes unobserved source levels',()=>{
 const report=JSON.parse(fs.readFileSync('outputs/wog-priorities-0.4.147/source-creature-levels/source.json'));
 assert.equal(report.activation,false);
 assert.equal(report.levels.length,363);
 assert.equal(report.bounds.cfgOverrides,178);
 assert.deepEqual(report.bounds.disabledNegativeLevelIds,[122,124,126,128]);
 assert.deepEqual(report.weaknessSpecialty.values,[3,3,2,2,1,1,0,4]);
 assert.equal(report.bindingEvidence.commanders.length,9);
 for(let id=197;id<=362;id++)assert.equal(report.levels[id].evidence.kind,'AmethystFirstParseInt');
});

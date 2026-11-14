import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {compileBankXpRows, bankXpHeader, digest} from '../scripts/era-bridge/creatures/source-bank-xp.mjs';

const fixture=JSON.parse(fs.readFileSync('tests/fixtures/tum/bank-xp6.json'));
test('bank XP cohort binds six exact source slots without changing the admitted43 cohort',()=>{
  assert.equal(fixture.cohortSha256,digest(fixture.rows));
  assert.equal(fs.readFileSync('work/vcmi-wasm/lib/era/EraSourceBankXpRows.h','utf8'),bankXpHeader(fixture));
  assert.deepEqual(fixture.rows.map(r=>[r.sourceId,r.code,r.spell,r.cacheSlot]),
    [[272,'p',21,7],[281,'p',21,7],[281,'a',22,8],[289,'a',21,9],[290,'a',16,9],[330,'K',13,11]]);
  const original=JSON.parse(fs.readFileSync('mod/tum-era/content/config/era-bridge-source-xp-admission-v1.json'));
  assert.equal(original.rows.length,43);
  assert(!original.rows.some(r=>fixture.rows.some(f=>f.sourceId===r.sourceId)));
});

test('actual bank XP dispatcher preserves phase, mastery, CURRENT power and rank-zero draws under UBSan',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bank-xp6-'));
  try {
    const cpp=path.join(dir,'test.cpp'),binary=path.join(dir,'test');
    fs.writeFileSync(cpp,`
#include "EraSourceBankXpRows.h"
#include <cassert>
#include <tuple>
#include <vector>
using namespace era_bridge;
struct Sink {
 int draws=0,queries=0; int currentSource=340;
 std::vector<std::tuple<int,int,int,int>> casts;
 bool prepareSourceGroup(char){return true;}
 bool casterAlive(){return true;}
 bool targetAlive(){return true;}
 int chanceRoll(){++draws;return 1;}
 int casterQuerySide(){return 0;}
 bool primaryAccepts(const SourceXpPrimaryQuery&q){assert(q.primaryQuerySide==0);++queries;return true;}
 SourceXpCurrent currentForCast(){return{currentSource,1,7};}
 void cast(const SourceXpCastRequest&q){assert(q.currentSide==1&&q.primaryQuerySide==0&&q.casterKind==1);casts.emplace_back(q.provenance.spell,q.mastery,q.power,q.provenance.cacheSlot);}
};
void run(int id,int rank,SourceXpPhase phase,Sink&s,SourceXpPermit permit=SourceXpPermit::Admitted){runSourceXpPhase(sourceBankXpRows,permit,phase,id,"tum-era:eraCreature"+std::to_string(id),rank,s);}
int main(){
 Sink off;run(281,10,SourceXpPhase::Before,off,SourceXpPermit::Off);assert(off.draws==0);
 Sink zero;run(281,0,SourceXpPhase::Before,zero);run(281,0,SourceXpPhase::After,zero);assert(zero.draws==0);
 Sink two;run(281,10,SourceXpPhase::Before,two);run(281,10,SourceXpPhase::After,two);
 assert(two.draws==2&&two.queries==2&&two.casts.size()==2);
 assert((two.casts[0]==std::make_tuple(21,3,8,7)));assert((two.casts[1]==std::make_tuple(22,3,8,8)));
 Sink fire;run(289,0,SourceXpPhase::After,fire);assert(fire.draws==1&&fire.casts.size()==1);assert(std::get<0>(fire.casts[0])==21);
 Sink ice;run(290,0,SourceXpPhase::After,ice);assert(ice.draws==1&&std::get<0>(ice.casts[0])==16);
 Sink wall;run(330,10,SourceXpPhase::After,wall);assert((wall.casts[0]==std::make_tuple(13,2,8,11)));
}
`);
    execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined',
      '-I'+path.resolve('work/vcmi-wasm/lib/era'),cpp,'-o',binary]);
    execFileSync(binary);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

const sourceRoot=process.env.TUM_SOURCE??'../Third-Upgrade-Mod-Full';
test('bank XP header reproduces original archive rows and cache slots',
  {skip:!fs.existsSync(path.join(sourceRoot,'Data/AmeCre.pac'))},()=>{
    assert.deepEqual(compileBankXpRows(sourceRoot),fixture);
  });

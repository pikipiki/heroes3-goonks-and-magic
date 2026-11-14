import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{execFileSync}from'node:child_process';
import{compileDwellingXpRows,dwellingXpHeader}from'../scripts/era-bridge/creatures/source-dwelling-xp.mjs';
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/tum/dwelling-xp17.json'));
test('dwelling XP keeps exact source slots and distinct intrinsic/XP stone/paralysis ownership',()=>{assert.equal(fs.readFileSync('work/vcmi-wasm/lib/era/EraSourceDwellingXpRows.h','utf8'),dwellingXpHeader(fixture));assert.equal(fixture.rows.length,17);assert.deepEqual(fixture.rows.filter(r=>r.existingSourceOwner),[]);assert.deepEqual(fixture.rows.filter(r=>r.spell===70||r.spell===74).map(r=>[r.sourceId,r.spell]),[[285,74],[312,70],[312,74]]);});
test('dwelling XP header regenerates from pinned original archive',()=>assert.deepEqual(compileDwellingXpRows('../Third-Upgrade-Mod-Full'),fixture));
test('production earthquake law preserves original allocation asymmetry and bounded RNG under UBSan',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xp-quake-'));try{fs.writeFileSync(path.join(dir,'test.cpp'),`
#include "EraSourceXpEarthquakeRule.h"
#include <cassert>
int main(){int calls=0;std::array<int,8> health{1,1,1,0,0,0,0,0};auto hits=era_bridge::sourceXpEarthquakeHits(health,4,[&](int lo,int hi){assert(lo==1);assert(hi==(calls==0?3:2));++calls;return 1;});assert(calls==4);assert(hits[0]==4&&hits[1]==0);calls=0;auto none=era_bridge::sourceXpEarthquakeHits({},4,[&](int,int){++calls;return 1;});assert(calls==0&&none[0]==0);}
`);execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),path.join(dir,'test.cpp'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}});

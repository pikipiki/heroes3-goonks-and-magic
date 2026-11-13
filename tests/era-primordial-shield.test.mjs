import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('346 source shield uses weaker spell override and REAL4 input before truncation', () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'primordial-shield-'));
 try {
  fs.writeFileSync(dir+'/test.cpp',`#include "${path.resolve('work/vcmi-wasm/lib/era/EraPrimordialShieldRule.h')}"
#include <cassert>
#include <limits>
int main(){using namespace era_bridge;
 assert(primordialShieldCoefficient(std::nullopt)==0.3f);
 assert(primordialShieldCoefficient(0.2f)==0.2f);
 assert(primordialShieldRaw(1000,100,std::nullopt)==30);
 assert(primordialShieldRaw(1000,100,0.2f)==20);
 assert(primordialShieldRaw(1000,100,0.25f)==25);
 assert(primordialShieldRaw(50,100,std::nullopt)==15);
 assert(primordialShieldRaw(0,100,std::nullopt)==0);
 assert(primordialShieldRaw(100,0,std::nullopt)==0);
 assert(primordialShieldRaw(16777219,16777219,std::nullopt)==5033166);
 assert((16777219LL*30)/100==5033165);
 // Signed MIN and ftol truncate towardzero; no unsigned reinterpretation.
 assert(primordialShieldRaw(-7,100,std::nullopt)==-2);
 assert(primordialShieldRaw(std::numeric_limits<int>::min(),100,std::nullopt)==-644245120);
 assert(primordialShieldRaw(std::numeric_limits<int>::max(),std::numeric_limits<int>::max(),std::nullopt)==644245120);
}`);
  execFileSync('c++',['-std=c++17','-fsanitize=undefined,float-cast-overflow','-fno-sanitize-recover=all',dir+'/test.cpp','-o',dir+'/test']);
  execFileSync(dir+'/test');
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

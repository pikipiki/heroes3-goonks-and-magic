import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('source127 visit chances, signed rewards and coordinate-seeded formation',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-rogue-ambush-'));
 try{
  const binary=path.join(dir,'check');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraRogueAmbushRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

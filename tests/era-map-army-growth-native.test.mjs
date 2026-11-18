import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('WoG116 daily growth floors four percent, caps at100000 and never shrinks larger stacks',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-army-growth-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraMapArmyGrowthRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('Enhanced Henchmen source arithmetic, progression, selection, XP and boundaries under UBSan',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-henchmen-'));
 try{
  const binary=path.join(directory,'rules');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic',
   '-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraHenchmanRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

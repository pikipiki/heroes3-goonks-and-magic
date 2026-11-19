import test from 'node:test';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('Mithril mine marker migration preserves remaining periods and source nibble bounds',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-mine-markers-'));
 try{
  const binary=path.join(directory,'rules');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic',
   '-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraMithrilMineRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

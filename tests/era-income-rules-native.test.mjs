import test from 'node:test';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
test('Original ERA income conversion truncates aggregate values and handles signed boundaries',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-income-'));
 try{
  const binary=path.join(directory,'income');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraIncomeRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('source239 placement order, guardian identities and fortnight schedule',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-town-banner-'));
 try{
  const binary=path.join(dir,'check');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraTownBannerRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

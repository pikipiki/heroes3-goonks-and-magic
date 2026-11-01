import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('Browser focus events defer a contended worker lock, then resume in order with a frame budget',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-browser-events-'));
 try{
  const compiler=process.env.CXX||'clang++',binary=path.join(directory,'browser-events');
  execFileSync(compiler,['-std=c++17','-pthread','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/BrowserEventQueue.test.cpp','-o',binary],{stdio:'pipe'});
  execFileSync(binary,[],{stdio:'pipe',timeout:5000});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

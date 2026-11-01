import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('Concurrent indexed PNG decodes retain independent palettes and release their buffers',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-png-'));
 try{
  const binary=path.join(directory,'png-decode');
  execFileSync(process.env.CXX||'clang++',['-std=c++17','-pthread','-fsanitize=address,undefined','tests/native/PngDecode.test.cpp','-o',binary],{stdio:'pipe'});
  execFileSync(binary,[],{stdio:'pipe',timeout:15000});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

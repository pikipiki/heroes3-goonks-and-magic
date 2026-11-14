import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('per-game WoG choices preserve inheritance, nine town combinations and foreign/Portal stocks',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-wog-options-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraWogOptions.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('option roster identities match the shipped source identities and faction rosters',()=>{
 const identities=JSON.parse(fs.readFileSync('mod/tum-era/era-identities.json','utf8'));
 const source=fs.readFileSync('work/vcmi-wasm/lib/era/EraWogOptions.h','utf8');
 const mapping=identities.creatures||identities;
 for(const id of[202,207,212,219,224,231,238,245,252,269,278,349,350,271,280,337,338,331,332,351,352,275,283,353,354,355,356])
  assert(source.includes('"'+mapping[id]+'"'),'Owned option identity '+id);
});

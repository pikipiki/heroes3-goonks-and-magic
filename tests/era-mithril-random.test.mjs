import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('Shrine shuffle, signed ranges and hut SafeRand match the compiled original Pascal',()=>{
 const reference=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/mithril-random-reference.json','utf8'));
 assert.equal(reference.source.commit,'b26cfca487ab2e5a535ba880fbd372605c9bfb70');assert.equal(reference.vectors.length,56);
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-mithril-random-'));
 try{
  const binary=path.join(folder,'random');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraMithrilRandomReference.cpp','-o',binary]);
  for(const {seed,...expected} of reference.vectors){
   const {choice,...actual}=JSON.parse(execFileSync(binary,[String(seed)],{encoding:'utf8'}));
   assert.deepEqual(actual,expected,'Pascal seed '+seed);
   assert.equal(choice,expected.shuffle.find(spell=>[1,3,4,5,66].includes(spell)),'First eligible shuffled spell, seed '+seed);
  }
  assert.equal(reference.startupVectors.length,9);
  for(const {state,sequence} of reference.startupVectors){
   const actual=JSON.parse(execFileSync(binary,state.map(String),{encoding:'utf8'}));
   assert.deepEqual(actual,sequence,'Secure startup words '+state.join(','));
  }
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});

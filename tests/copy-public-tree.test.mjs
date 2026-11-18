import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {copyPublicTree} from '../scripts/copy-public-tree.mjs';
import {versionModuleImports} from '../scripts/version-runtime.mjs';

test('rewriting published modules never follows source file or directory links',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-publish-copy-'));
 try{
  const source=path.join(root,'source'),outside=path.join(root,'original'),output=path.join(root,'output');
  fs.mkdirSync(source);fs.mkdirSync(outside);
  const original="import {x} from './shared.mjs';\n";
  fs.writeFileSync(path.join(outside,'mobile.mjs'),original);
  fs.writeFileSync(path.join(outside,'mod.json'),'{"enabled":true}\n');
  fs.symlinkSync(path.join(outside,'mobile.mjs'),path.join(source,'mobile.mjs'));
  fs.symlinkSync(outside,path.join(source,'nested'),'dir');
  copyPublicTree(source,output);
  for(const file of ['mobile.mjs','nested/mobile.mjs']){
   const target=path.join(output,file);assert.equal(fs.lstatSync(target).isSymbolicLink(),false);
   fs.writeFileSync(target,versionModuleImports(fs.readFileSync(target,'utf8'),'release'));
   assert.match(fs.readFileSync(target,'utf8'),/shared\.mjs\?v=release/);
  }
  assert.equal(fs.lstatSync(path.join(output,'nested')).isDirectory(),true);
  assert.equal(fs.lstatSync(path.join(output,'nested/mod.json')).isFile(),true);
  assert.equal(fs.readFileSync(path.join(outside,'mobile.mjs'),'utf8'),original);
  assert.equal(fs.readFileSync(path.join(source,'mobile.mjs'),'utf8'),original);
  assert.equal(fs.lstatSync(path.join(source,'mobile.mjs')).isSymbolicLink(),true);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

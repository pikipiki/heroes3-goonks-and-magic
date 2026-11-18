import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {requiresUiLibrary,importsUiLibrary,violations} from '../scripts/check-ui-components.mjs';
const markup="const panel=document.createElement('section');panel.innerHTML='<header>Title</header><button>OK</button>';";
test('UI guard covers new screens and leaves logic and library internals alone',()=>{
 assert.deepEqual(violations(['outputs/large-catalogue.json','game-data/binary.bin'],()=>{throw Error('Unrelated data must never be read');}),[]);
 assert(requiresUiLibrary('web/new-screen.mjs',markup));assert(!requiresUiLibrary('web/logic.mjs','export const count=3;'));assert(!requiresUiLibrary('web/ui/new-component.mjs',markup));assert(!requiresUiLibrary('tests/screen.test.mjs',markup));
 assert(importsUiLibrary("import {useScreenComponents} from './ui/components.mjs';"));assert.deepEqual(violations(['web/a.mjs','web/b.mjs'],file=>file.endsWith('a.mjs')?markup:"import {buttonMarkup} from './ui/components.mjs';"+markup),['web/a.mjs']);
});
test('pre-commit reads the index, rejects copied UI, and installer is idempotent',()=>{
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-ui-hook-')),git=(...args)=>execFileSync('git',args,{cwd,stdio:'pipe'});
 try{
  for(const dir of ['scripts','.githooks','web'])fs.mkdirSync(path.join(cwd,dir));
  for(const file of ['scripts/check-ui-components.mjs','scripts/install-ui-hook.mjs','.githooks/pre-commit'])fs.copyFileSync(file,path.join(cwd,file));
  git('init','-q');const hooks=path.join(cwd,'.git/hooks'),old=path.join(hooks,'pre-commit');fs.writeFileSync(old,'#!/bin/sh\nprintf preserved > hook-ran\n');fs.chmodSync(old,0o755);
  for(let i=0;i<2;i++)execFileSync(process.execPath,['scripts/install-ui-hook.mjs'],{cwd});
  assert(fs.readFileSync(old+'.before-ui','utf8').includes('preserved'));
  const file=path.join(cwd,'web/new-screen.mjs'),run=()=>spawnSync('sh',[old],{cwd,encoding:'utf8',env:{...process.env,PATH:path.dirname(process.execPath)+':'+process.env.PATH}});
  fs.writeFileSync(file,markup);git('add','web/new-screen.mjs');fs.writeFileSync(file,"import {buttonMarkup} from './ui/components.mjs';"+markup);
  const rejected=run();assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/web\/new-screen.mjs/);assert(!fs.existsSync(path.join(cwd,'hook-ran')),'Chained hooks run only after the UI check passes');
  git('add','web/new-screen.mjs');fs.writeFileSync(file,markup);const accepted=run();assert.equal(accepted.status,0,accepted.stderr);assert.equal(fs.readFileSync(path.join(cwd,'hook-ran'),'utf8'),'preserved');
 }finally{fs.rmSync(cwd,{recursive:true,force:true});}
});
test('semantic text colours meet Material contrast requirements',()=>{
 const css=fs.readFileSync('web/ui/tokens.css','utf8'),tokens=Object.fromEntries([...css.matchAll(/--ui-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m=>[m[1],m[2]]));
 const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 for(const [foreground,background]of [['on-surface','surface'],['on-surface-variant','surface-high'],['on-primary','primary'],['on-primary-container','primary-container'],['on-secondary','secondary-container'],['on-error','error']]){const values=[luminance(tokens[foreground]),luminance(tokens[background])].sort((a,b)=>b-a);assert((values[0]+.05)/(values[1]+.05)>=4.5,foreground+'/'+background);}
});

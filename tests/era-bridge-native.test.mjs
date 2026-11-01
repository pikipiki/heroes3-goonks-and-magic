import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
test('Portable ERA runtime uses exact probability boundaries, raw resurrection HP and authoritative event deltas',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'heroes-era-runtime-'));
 try{let compiler;for(const candidate of [...new Set([process.env.CXX,'clang++','g++'].filter(Boolean))]){try{execFileSync(candidate,['--version'],{stdio:'ignore'});compiler=candidate;break;}catch{}}
 assert(compiler,'A C++17 compiler is required to verify the native ERA bridge');
 const binary=path.join(directory,'runtime-test');execFileSync(compiler,['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraBridgeRuntime.test.cpp','-o',binary],{stdio:'pipe'});execFileSync(binary,[],{stdio:'pipe'});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

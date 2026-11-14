import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {inspectMysteriousCave} from '../scripts/era-bridge/objects/mysterious-cave.mjs';

test('Cave production source rules preserve draws, overwrittenXP, timer restoration and signed arithmetic',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'era-cave-'));
 try{
  const executable=path.join(dir,'rules');
  execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),'scripts/era-bridge/objects/native/EraMysteriousCaveRulesTest.cpp','-o',executable]);
  execFileSync(executable);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
const source=path.join(process.env.TUM_SOURCE??'../Third-Upgrade-Mod-Full','Data/s/Mysterious Cave.erm');
test('Pinned full Cave source includes34callbacks,45 reward labels and actual execution exceptions',{skip:!fs.existsSync(source)},()=>{
 const bytes=fs.readFileSync(source),contract=inspectMysteriousCave(bytes);
 assert.equal(contract.callbacks.length,34);assert.equal(contract.rewards.length,45);
 assert.equal(contract.tomePrice,300000);assert.equal(contract.dailyRandomDraws,14);
 assert.equal(contract.activation,false);assert.equal(contract.nativeValidated,false);
 assert.throws(()=>inspectMysteriousCave(Buffer.concat([bytes,Buffer.from(' ')])));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
const source='work/downloads/wog-port185/root/hmm35wog.pac';
test('CD defaults reproduce all396 pinned original building thresholds and the PAC daily controls',{skip:!fs.existsSync(source)},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-cd-source-'));
 try{const generated=path.join(dir,'data.h');execFileSync(process.execPath,['scripts/era-bridge/campaigns/generate-demolition-data.mjs',source,generated]);assert.equal(fs.readFileSync(generated,'utf8'),fs.readFileSync('work/vcmi-wasm/lib/era/EraCampaignDemolitionData.h','utf8'));}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('The original second scenario preserves its repeated Castle army overrides',()=>{
 const p=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/zc1-2.json'));
 const cd=p.initializers.filter(c=>c.receiver==='CD').flatMap(c=>c.operations);
 assert.equal(cd.length,34);
 const army=cd.filter(o=>o.code==='A');assert.equal(army.length,17);
 assert(army.every(o=>o.args[0].number===0&&o.args[2].number===0));
 const rebuilding=cd.filter(o=>o.code==='E'&&o.args[1].number===16);
 assert.deepEqual(rebuilding.map(o=>o.args.map(a=>a.number)),[[0,16,100000],[1,16,100000],[4,16,100000],[7,16,100000]]);
});

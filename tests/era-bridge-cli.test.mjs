import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import os from'node:os';import path from'node:path';import{spawnSync}from'node:child_process';
test('The CLI preserves existing services and leaves the complete policy unchanged when a conflicting source is rejected',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'era-bridge-cli-'));
 try{const cfg=path.join(root,'unit.cfg'),output=path.join(root,'runtime.json');fs.writeFileSync(cfg,'RegenerationHitPoints=50\nRegenerationChance=50');fs.writeFileSync(output,JSON.stringify({schemaVersion:1,creatures:{'tum-era:other':{regeneration:{hitPoints:200,chancePercent:100}}}}));
 const run=()=>spawnSync(process.execPath,['scripts/era-bridge/cli.mjs','regeneration',cfg,'tum-era:hydra',output],{encoding:'utf8'});
 assert.equal(run().status,0);assert.equal(Object.keys(JSON.parse(fs.readFileSync(output)).creatures).length,2);const before=fs.readFileSync(output);fs.writeFileSync(cfg,'RegenerationHitPoints=100\nRegenerationChance=50');const failure=run();assert.notEqual(failure.status,0);assert.match(failure.stderr,/Conflicting ERA policies/);assert.deepEqual(fs.readFileSync(output),before);assert(!fs.readdirSync(root).some(n=>n.includes('.tmp-')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

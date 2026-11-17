import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import path from 'node:path';import os from 'node:os';
test('audit builds reject project and parent directories before removing output',()=>{
 for(const output of [process.cwd(),path.dirname(process.cwd()),os.tmpdir(),os.tmpdir()+'-other/goonk-test']){
  const result=spawnSync(process.execPath,['scripts/build-site.mjs'],{encoding:'utf8',env:{...process.env,GOONK_AUDIT_OUTPUT:output}});
  assert.notEqual(result.status,0);assert.match(result.stderr,/Audit output must be a goonk- directory inside the system temporary directory/);
 }
});

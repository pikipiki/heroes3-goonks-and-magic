import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {WASI} from 'node:wasi';
test('compiled real OpenBW reactor instantiates and exposes the pinned native ABI (no game data)',async()=>{
  const bytes=fs.readFileSync(new URL('../public/starcraft/openbw.wasm',import.meta.url));
  const build=JSON.parse(fs.readFileSync(new URL('../public/starcraft/engine-build.json',import.meta.url)));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),build.sha256);
  const module=await WebAssembly.compile(bytes);
  const wasi=new WASI({version:'preview1',args:[],env:{}}),env={};
  for(const entry of WebAssembly.Module.imports(module))if(entry.module==='env')env[entry.name]=()=>{throw Error('Uninitialized reactor must not request game assets or sound');};
  const instance=await WebAssembly.instantiate(module,{wasi_snapshot_preview1:wasi.wasiImport,env});
  wasi.initialize(instance);
  for(const name of ['openbw_init','openbw_init_mp','openbw_step','openbw_render','openbw_apply','openbw_frame','openbw_checksum','openbw_post_message','openbw_save_replay'])assert.equal(typeof instance.exports[name],'function',name);
  assert.equal(instance.exports.openbw_frame(),0);
  // Native init/stepping without MPQs is deliberately not attempted.
});

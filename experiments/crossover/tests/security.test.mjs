import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
test('shipped OpenBW transport and WASM expose no network or process execution capabilities',async()=>{
 const host=fs.readFileSync(new URL('../public/starcraft/openbw.js',import.meta.url),'utf8');
 const net=fs.readFileSync(new URL('../public/starcraft/net.js',import.meta.url),'utf8');
 for(const code of [host,net])assert(!/RTCPeerConnection|new WebSocket|sendBeacon|XMLHttpRequest|stun:|https:\/\/archive.org|https:\/\/raw.githubusercontent.com/.test(code));
 const module=await WebAssembly.compile(fs.readFileSync(new URL('../public/starcraft/openbw.wasm',import.meta.url)));
 assert(!WebAssembly.Module.imports(module).some(row=>/sock|exec|system|spawn/i.test(row.name)));
 assert(host.includes('path_open: () => EBADF'));
});
test('all hosted StarCraft chunks reconstruct exactly the three audited MPQs',()=>{
 const root=new URL('../../../game-data/starcraft/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
 assert.deepEqual(manifest.archives.map(row=>row.name),['stardat.mpq','broodat.mpq','patch_rt.mpq']);
 const used=new Set(),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const archive of manifest.archives){const pieces=archive.chunks.map(chunk=>{assert(/^chunks\/[a-f0-9]{64}\.bin$/.test(chunk.url));used.add(chunk.url.slice(7));const bytes=fs.readFileSync(new URL(chunk.url,root));assert.equal(bytes.length,chunk.size);assert.equal(hash(bytes),chunk.sha256);return bytes;});const bytes=Buffer.concat(pieces);assert.equal(bytes.length,archive.size);assert.equal(hash(bytes),archive.sha256);}
 assert.deepEqual(fs.readdirSync(new URL('chunks/',root)).sort(),[...used].sort(),'No stale or unreferenced source chunks published');
});

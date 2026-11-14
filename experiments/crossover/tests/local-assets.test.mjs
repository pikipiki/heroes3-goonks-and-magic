import {test} from 'node:test';
import assert from 'node:assert/strict';
import {archiveName,validateArchive} from '../public/local-assets.js';
// Syntactic archive-header fixtures, never used as simulation data.
function header(){const bytes=new Uint8Array(32),v=new DataView(bytes.buffer);v.setUint32(0,0x1a51504d,true);v.setUint32(4,32,true);v.setUint32(8,32,true);return bytes;}
test('archive identities are explicit and case insensitive',()=>{
  assert.equal(archiveName('StarDat.MPQ'),'stardat.mpq');
  assert.throws(()=>archiveName('map.scx'));assert.throws(()=>archiveName('../stardat.mpq'));
});
test('MPQ headers, supported versions and table bounds are validated',()=>{
  validateArchive(header());
  assert.throws(()=>validateArchive(new Uint8Array(64)));
  const b=header(),v=new DataView(b.buffer);
  v.setUint32(8,100,true);assert.throws(()=>validateArchive(b));
  v.setUint32(8,32,true);v.setUint16(12,2,true);assert.throws(()=>validateArchive(b));
  v.setUint16(12,0,true);v.setUint32(24,1,true);v.setUint32(16,32,true);assert.throws(()=>validateArchive(b));
});

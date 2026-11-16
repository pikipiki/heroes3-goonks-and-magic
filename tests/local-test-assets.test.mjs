import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {dedupeLocalTestAssets} from '../scripts/dedupe-local-test-assets.mjs';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-dedupe-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function put(root,release,bytes,hash=sha(bytes)){const file=path.join(root,release,'assets/base',hash+'.bin');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);return file;}

test('dry run verifies duplicates without changing files; apply shares bytes and remains independent of directory removal',t=>{
 const root=fixture(t),bytes=Buffer.from('immutable native game asset'),a=put(root,'release1',bytes),b=put(root,'release2',bytes),unique=put(root,'release2',Buffer.from('unique asset'));
 const save=path.join(root,'release2','private.vsgm1');fs.writeFileSync(save,'keep save');
 const original=fs.statSync(b).ino,plan=dedupeLocalTestAssets(root);assert.equal(plan.duplicateFiles,1);assert.equal(plan.linkedFiles,0);assert.equal(fs.statSync(b).ino,original);
 const applied=dedupeLocalTestAssets(root,{apply:true});assert.equal(applied.linkedFiles,1);assert.equal(fs.statSync(a).ino,fs.statSync(b).ino);assert.equal(fs.readFileSync(unique,'utf8'),'unique asset');assert.equal(fs.readFileSync(save,'utf8'),'keep save');
 assert.equal(dedupeLocalTestAssets(root,{apply:true}).linkedFiles,0);
 fs.rmSync(path.join(root,'release1'),{recursive:true});assert.deepEqual(fs.readFileSync(b),bytes);
});

test('rejects mislabeled bytes instead of replacing an asset',t=>{
 const root=fixture(t),a=put(root,'release1',Buffer.from('correct')),b=put(root,'release2',Buffer.from('corrupted'),sha(Buffer.from('correct'))),original=fs.statSync(b).ino;
 assert.throws(()=>dedupeLocalTestAssets(root,{apply:true}),/Content hash mismatch/);assert.equal(fs.statSync(b).ino,original);assert.equal(fs.readFileSync(a,'utf8'),'correct');assert.equal(fs.readFileSync(b,'utf8'),'corrupted');
});

test('ignores symlinked assets, non-snapshot directories, and non-addressed files',t=>{
 const root=fixture(t),bytes=Buffer.from('asset'),source=put(root,'source',bytes),a=put(root,'release1',bytes);fs.mkdirSync(path.join(root,'release2'));fs.symlinkSync(path.dirname(path.dirname(source)),path.join(root,'release2/assets'));
 const hiddenSave=path.join(root,'release1/assets/data',sha(bytes),'Saves/test.vsgm1');fs.mkdirSync(path.dirname(hiddenSave),{recursive:true});fs.writeFileSync(hiddenSave,bytes);
 const plain=path.join(root,'release1/assets/save.vsgm1');fs.writeFileSync(plain,'private');
 const report=dedupeLocalTestAssets(root,{apply:true});assert.equal(report.checkedFiles,1);assert.equal(report.linkedFiles,0);assert.notEqual(fs.statSync(a).ino,fs.statSync(source).ino);assert.equal(fs.readFileSync(plain,'utf8'),'private');
});

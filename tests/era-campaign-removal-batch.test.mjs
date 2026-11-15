import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readOriginalCampaign} from '../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../scripts/era-bridge/artifacts/importer.mjs';

test('all original Ellam rock-removal choices clear the same complete passage',()=>{
 const program=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/zc3-0.json'));
 const block=program.blocks.find(b=>b.receiver==='LE'&&b.selectors.map(a=>a.number).join('/')==='31/59/0');assert(block);
 const commands=block.commands.slice(1,15);assert.equal(commands.length,14);
 const positions=commands.map(c=>{assert.equal(c.receiver,'UN');assert.deepEqual(c.conditions,[]);assert.equal(c.operations.length,1);const o=c.operations[0];assert.equal(o.code,'O');assert(o.args.every(a=>a.kind==='number'&&a.access==='read'));return o.args.map(a=>a.number);});
 const objects=parseJsonc(readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc3.vcmp').maps[0].map['objects.json'].toString());
 const covers=(o,[x,y,z])=>{if(o.l!==z)return false;const m=o.template.mask,row=y-o.y+m.length-1;if(row<0||row>=m.length)return false;const column=x-o.x+m[row].length-1;return column>=0&&column<m[row].length&&m[row][column]==='B';};
 const rocks=Object.values(objects).filter(o=>o.type==='rock'&&positions.some(p=>covers(o,p)));assert.equal(rocks.length,8);
 const coverage=positions.map(p=>rocks.reduce((mask,o,i)=>mask|(covers(o,p)?1<<i:0),0));
 assert.equal(new Set(coverage).size,2);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-removal-batch-'));
 try{
  const binary=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignRemovalBatch.test.cpp','-o',binary]);
  execFileSync(binary);execFileSync(binary,[String(rocks.length),...coverage.map(String)]);
  assert.throws(()=>execFileSync(binary,[String(rocks.length),...coverage.slice(0,2).map(String)]),e=>e.status===2,'A short non-equivalent prefix must stay rejected');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

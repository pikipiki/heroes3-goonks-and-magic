import test from 'node:test';
import assert from 'node:assert/strict';
import {compileNativeCampaign, compileNativeSource} from '../scripts/era-bridge/campaigns/native-compiler.mjs';
import {readOriginalCampaign, sha256} from '../scripts/era-bridge/campaigns/importer.mjs';

test('all eleven campaign programs compile with explicit source-bound exceptions', () => {
 let scenarios = 0, sources = 0;
 const exceptions = [];
 for (const id of ['zc1', 'zc2', 'zc3', 'zc4']) {
  const file = `mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`;
  const original = readOriginalCampaign(file), compiled = compileNativeCampaign(file);
  assert.equal(compiled.executionValidated, false);
  for (const [index, scenario] of compiled.scenarios.entries()) {
   scenarios++; sources += scenario.programs.length;
   const merged = scenario.program;
   assert.equal(merged.mapSha256, original.maps[index].mapSha256);
   assert.equal(merged.blocks.length, scenario.programs.reduce((n, p) => n + p.blocks.length, 0));
   let offset = 0, initializer = 0;
   for (const [sourceIndex, program] of scenario.programs.entries()) {
    assert.equal(program.originalSha256, sha256(original.maps[index].sources[sourceIndex].bytes));
    for (const command of program.initializers)
     assert.equal(merged.initializers[initializer++].visibleBlocks, offset + command.visibleBlocks);
    offset += program.blocks.length;
    exceptions.push(...program.exceptions);
   }
   assert.deepEqual(compileNativeCampaign(file).scenarios[index].program, merged, 'Stable map identity and source order');
  }
 }
 assert.equal(scenarios, 11);
 assert.equal(sources, 137);
 assert.equal(exceptions.filter(e => e.kind === 'syntax-repair').length, 4);
 assert.equal(exceptions.filter(e => e.kind === 'detached-disabled-receiver').length, 16);
 assert.equal(new Set(exceptions.map(e => e.originalSha256)).size, 5);
});

test('canonical repairs preserve independent initializers and reject altered source identity', () => {
 const campaign = readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp');
 const source = campaign.maps.flatMap(map => map.sources).find(s => s.sha256.startsWith('71bd544f'));
 const program = compileNativeSource(source);
 assert(program.initializers.some(c => c.receiver === 'OB' && c.selectors.map(v => v.number).join('/') === '41/65/0'));
 assert.throws(() => compileNativeSource({...source, bytes: Buffer.concat([source.bytes, Buffer.from(' ')])}), /identity/);
 const changed = Buffer.from(source.bytes.toString().replace('ZVSE', 'ZVSE\n'));
 assert.throws(() => compileNativeSource({...source, sha256: sha256(changed), bytes: changed}), /Receiver before first trigger/,
  'A similar but unpinned source does not inherit the exception');
});

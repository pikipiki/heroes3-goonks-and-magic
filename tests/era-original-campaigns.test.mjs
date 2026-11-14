import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileCaveFile, readOriginalCampaign, readZip} from '../scripts/era-bridge/campaigns/importer.mjs';
import {compileErm, tokenizeErm} from '../scripts/era-bridge/campaigns/parser.mjs';

test('original Cave scripts are hash-bound and parsed without claiming execution', () => {
  const program = compileCaveFile();
  assert.equal(program.sources.length, 22);
  assert.equal(program.blocks.length, 48);
  assert.equal(program.initializers.length, 1);
  assert.equal(program.mapSha256, '3d7dbf2835db47991ee9dad4f7cdef3dde93f98086670594bf21668d2c033c50');
  assert(program.sources.every((source, index, all) => index === 0 || source.firstOccurrence >= all[index - 1].firstOccurrence));
  const manifest = JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/maps/mod.json', 'utf8'));
  assert.equal(manifest.keepDisabled, true, 'Parsing is not sufficient to enable the original scenarios');
});

test('eleven original scenarios retain source order and explicit unsupported syntax', () => {
  let scenarios = 0, parsed = 0;
  const rejected = [];
  for (const id of ['zc1', 'zc2', 'zc3', 'zc4']) {
    const campaign = readOriginalCampaign(`mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`);
    scenarios += campaign.maps.length;
    for (const map of campaign.maps) {
      assert(map.sources.every((source, index, all) => index === 0 || source.firstOccurrence >= all[index - 1].firstOccurrence));
      for (const source of map.sources) {
        try { compileErm(source.bytes, {source: source.id}); parsed++; }
        catch (error) { rejected.push({id: source.id, sha256: source.sha256, message: error.message}); }
      }
    }
  }
  assert.equal(scenarios, 11);
  assert.equal(parsed, 132);
  assert.equal(rejected.length, 5);
  const expected = JSON.parse(fs.readFileSync('outputs/wog-priorities-0.4.147/campaigns169/parser-review.json', 'utf8'));
  assert.deepEqual(rejected, expected.unsupportedSources, 'Unknown syntax must not be silently dropped or repaired');
});

test('campaign tokenizer keeps semicolons and line breaks inside source text', () => {
  const tokens = tokenizeErm(Buffer.from('ZVSE\n!?LE1/2/0;\n!!IF:M^One;\ntwo^; comment\n!!IF:V1/1;'));
  assert.equal(tokens.length, 3);
  assert.equal(tokens[1].statement, '!!IF:M^One;\ntwo^;');
  assert.equal(tokens[2].line, 5);
  assert.throws(() => compileErm('ZVSE\n!?LE1/2/0;\n!!SN:E0;'), /Unbound receiver/);
});

test('campaign archive reader rejects altered member checksums', () => {
  const bytes = fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp');
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const directory = bytes.readUInt32LE(end + 16);
  bytes[directory + 16] ^= 1;
  assert.throws(() => readZip(bytes), /checksum/);
});

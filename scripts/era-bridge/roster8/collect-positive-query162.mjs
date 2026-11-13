/** Retain the real positive-float query witness; no actor admission implied. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const [run, out = 'outputs/wog-priorities-0.4.147'] = process.argv.slice(2);
if (!run) throw Error('RUN_DIRECTORY [OUTPUT_DIRECTORY]');
const data = JSON.parse(fs.readFileSync(path.join(run, 'result.json')));
const engine = '077528260dcb9192dd2aa69245841bcce7a1c462d6028da8d244f37543d2aefd';
assert.equal(data.passed, true);
assert.deepEqual(data.errors, []);
assert.equal(data.report.engineMetadata.sha256, engine);
const row = data.report.conflux355PositiveFloatQuery;
assert.equal(row.blueHeroSheet.heroWindow.level, 39);
assert(row.blueHeroSheet.heroWindow.skills.some(s => s.name === 'Resistance' && s.mastery === 'Expert'));
assert.equal(row.physical, 31);
assert.equal(row.arrow, 20);
assert.equal(row.loss, 51);
fs.mkdirSync(out, {recursive: true});
const artifacts = ['result.json', 'console.log', 'conflux355-positive-float-query.png'].map(name => {
  const bytes = fs.readFileSync(path.join(run, name));
  const target = path.join(out, 'conflux355-positive-query162-' + name);
  fs.writeFileSync(target, bytes);
  return {path: target, sha256: crypto.createHash('sha256').update(bytes).digest('hex')};
});
fs.writeFileSync(path.join(out, 'native-conflux355-positive-query162.json'), JSON.stringify({
  passed: true, allControlsComplete: true, engineSHA: engine,
  scope: '355 automatic spell eligibility preserves a strictly positive source float probability below one percent; no random percentage conversion.',
  nativeHero: {name: row.blueHeroSheet.heroName, level: 39, resistanceMastery: 'Expert'},
  sourceInputs: {battleDwarfResistance: 40, thorgrimExpertResistance: 59, adjacentUnicornAura: 20},
  sourceProbability: row.sourceProbability,
  observed: {physical: row.physical, magicArrow: row.arrow, total: row.loss},
  fixture: row.fixture,
  artifacts,
  limits: 'One causal below-one-percent native witness. Ordinary integer chance callers and whole-actor admission remain governed by their separate contracts.'
}, null, 2) + '\n');
console.log('Retained native355 positive float query: physical31 + Arrow20 =51.');

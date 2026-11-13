import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {admitPrivate43, validateAdmission43, admitValidated43, rowKey, digest, OVERLAPS} from '../scripts/era-bridge/creatures/source-xp-admission.mjs';
import {migrateLegacyCasting, migrateJsonMembers, selectMigrationScope, reconcileProfiles} from '../scripts/era-bridge/creatures/source-xp-migration.mjs';
import {parseJsonc} from '../scripts/era-bridge/artifacts/importer.mjs';

const base = 'outputs/wog-priorities-0.4.147/source-xp-complete166/';
const read = file => JSON.parse(fs.readFileSync(base + file));
const canonical = read('admission43.candidate.json');
const proposal = read('migration184.candidate.json');
const before = file => fs.readFileSync(base + 'before/' + file);

test('XP admission closes all43 rows and rejects DEFEND, existing owners and partial validation', () => {
  assert.equal(canonical.rows.length, 43);
  assert.equal(new Set(canonical.rows.map(r => r.sourceId)).size, 36);
  assert.equal(canonical.rows.filter(r => r.executionOwner === 'candidateLedger').length, 40);
  for (const key of ['231:a:62', 'eraSourceXpDefend:enrolled:v1', 'goonk:bubu']) {
    assert.throws(() => admitPrivate43(canonical, [key]));
  }
  const altered = structuredClone(canonical);
  altered.rows[0].chances[0] = 100;
  assert.throws(() => validateAdmission43(altered, canonical));
  const contracts = {passed:true, nativeValidated:true, cohortSha256:canonical.cohortSha256,
    rows:canonical.rows.map(r => ({key:rowKey(r), passed:true, evidenceSha256:digest('unit fixture')}))};
  const migration = {passed:true, cohortSha256:canonical.cohortSha256, existingOwnersPreserved:true,
    nativeAndGoonkBytesPreserved:true, innatesPreservedExceptVerified241Proxy:true};
  const proof = sourceId => ({sourceId, nativeValidated:true, proofSha256:digest('unit fixture')});
  const evidence = {contracts, migration, wholeActors:[...new Set(canonical.rows.map(r => r.sourceId))].map(proof), innateOwnership:OVERLAPS.map(proof)};
  assert.equal(admitValidated43(canonical, evidence).admittedRows.length, 40);
  assert.throws(() => admitValidated43(canonical, {...evidence, wholeActors:evidence.wholeActors.slice(1)}));
  assert.throws(() => admitValidated43(canonical, {...evidence, contracts:{...contracts, rows:contracts.rows.slice(1)}}));
});

test('exact migration retires15 CSV and34 manifest members, preserving unrelated bytes and innates', () => {
  const old = before(proposal.legacyFile);
  const migrated = migrateLegacyCasting(proposal.legacyPlan, old);
  assert.equal(proposal.legacyPlan.remove.length, 15);
  assert.equal(proposal.jsonRetirements.length, 34);
  assert(!proposal.legacyPlan.remove.some(r => /^(94|231|254):/.test(r.rowKey)));
  assert.throws(() => migrateLegacyCasting(proposal.legacyPlan, Buffer.concat([old, Buffer.from('\n')])));
  assert(migrated.length < old.length);
  for (const file of new Set(proposal.jsonRetirements.map(r => r.file))) {
    const original = before(file), rows = proposal.jsonRetirements.filter(r => r.file === file);
    const next = migrateJsonMembers(original, rows), a = parseJsonc(original.toString()), b = parseJsonc(next.toString());
    for (const key of Object.keys(a)) assert.deepEqual(b[key].abilities, a[key].abilities);
    assert(next.length < original.length);
    assert.throws(() => migrateJsonMembers(Buffer.concat([original, Buffer.from(' ')]), rows));
  }
  const partial = selectMigrationScope(proposal, admitPrivate43(canonical, ['261:J:45']));
  assert(!partial.jsonRetirements.some(r => r.sourceRowKey === '261:J:45'));
  const pair = selectMigrationScope(proposal, admitPrivate43(canonical, ['261:J:45', '261:p:52']));
  assert.equal(pair.jsonRetirements.filter(r => r.sourceRowKey === '261:J:45').length, 1);
});

test('only164/165 original profile fallback changes; all Goonk profiles remain identical', () => {
  const review = read('profiles164165.patch-review.json');
  const original = JSON.parse(before(proposal.profileReview.registryFile));
  const next = reconcileProfiles(original, review.changes);
  assert.deepEqual(review.changes.map(r => r.sourceId), [164, 165]);
  for (const [key, profile] of Object.entries(original.creatures)) {
    if (!review.changes.some(r => r.nativeId === key)) assert.deepEqual(next.creatures[key], profile);
  }
  assert.deepEqual(next, read('profiles164165.candidate.json'));
});

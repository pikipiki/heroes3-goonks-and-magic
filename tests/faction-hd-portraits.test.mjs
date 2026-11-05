import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import portraits from '../web/faction-hd-portraits-data.mjs';
import castle from '../web/castle-hd-portraits-data.mjs';
import {hasHDCreaturePortrait} from '../web/goonk-hd-portraits.mjs';
import {creaturePortrait} from '../web/creature-portraits.mjs';

test('Every audited town evolution uses its own high-resolution portrait', () => {
  const audit = JSON.parse(fs.readFileSync(new URL('../outputs/creature-skin-audit/report.json', import.meta.url)));
  const entries = audit.rosters.flatMap(family => family.units);
  const artwork = {...portraits, ...castle};
  const regions = new Set();
  const files = new Set();

  assert.equal(entries.length, 198);
  assert.equal(Object.keys(artwork).length, entries.length);
  for (const {id} of entries) {
    assert(hasHDCreaturePortrait({key: id}), id);
    assert(creaturePortrait({id: 0, key: id}).includes('data-creature-key="' + id + '"'), id);
    const rect = artwork[id.toLowerCase()];
    assert(rect.w >= 350 && rect.h >= 350, id);
    regions.add(JSON.stringify(rect));
    files.add(rect.file);
  }
  assert.equal(regions.size, entries.length);
  for (const file of files) {
    const bytes = fs.readFileSync(new URL('../web/' + file, import.meta.url));
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', file);
    assert(bytes.length > 10000, file);
  }
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('All client modules in web/ parse without syntax errors', () => {
 const files = fs.readdirSync('web').filter(f => f.endsWith('.mjs') || f.endsWith('.js'));
 for (const file of files) {
  const filePath = path.join('web', file);
  const result = spawnSync(process.execPath, ['--check', filePath], {encoding: 'utf8'});
  assert.equal(result.status, 0, `Syntax error in ${filePath}: ${result.stderr}`);
 }
});

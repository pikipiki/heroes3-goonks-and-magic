import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

for (const suite of ['Timed', 'Geometry']) {
  test(`production XP ${suite}: signed arithmetic, lifecycle and source rules under UBSan`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'era-xp-rules-'));
    try {
      const binary = path.join(dir, 'test');
      execFileSync('c++', ['-std=c++17', '-Wall', '-Wextra', '-Werror', '-pedantic',
        '-fsanitize=undefined', '-I' + path.resolve('work/vcmi-wasm/lib/era'),
        `scripts/era-bridge/creatures/native/EraSourceXp${suite}RulesTest.cpp`, '-o', binary]);
      execFileSync(binary);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
}

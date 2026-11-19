import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('source129 preserves signed HP multiplication, truncation and the six erased XP row predicates',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-no-shooting-'));
 try{const binary=path.join(dir,'check');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraMapNoShootingRules.test.cpp','-o',binary]);execFileSync(binary);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

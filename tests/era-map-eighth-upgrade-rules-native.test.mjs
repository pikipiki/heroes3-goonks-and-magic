import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('source125 preserves type pairs, wrapped army precheck, experience caps and signed overflow',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-eighth-upgrade-'));
 try{const binary=path.join(dir,'check');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraMapEighthUpgradeRules.test.cpp','-o',binary]);execFileSync(binary);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

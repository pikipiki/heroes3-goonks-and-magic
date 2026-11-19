import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('original hide-fog player decoder, source120 bitset composition and circular boundary stay distinct',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-source-fog-'));
 try{const binary=path.join(dir,'check');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraSourceFogRules.test.cpp','-o',binary]);execFileSync(binary);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

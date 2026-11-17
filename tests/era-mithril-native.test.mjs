import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('Mithril prices, team-site distance and seven future income periods match script42',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-mithril-'));
 try{const binary=path.join(folder,'rules');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraMithrilRules.test.cpp','-o',binary]);execFileSync(binary);}finally{fs.rmSync(folder,{recursive:true,force:true});}
});

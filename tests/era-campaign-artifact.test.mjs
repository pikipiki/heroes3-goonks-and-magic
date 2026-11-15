import test from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
test('source slot queries distinguish an empty slot, spellbook and encoded scroll spells',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-campaign-artifact-'));
 try{const binary=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignArtifact.test.cpp','-o',binary]);execFileSync(binary);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

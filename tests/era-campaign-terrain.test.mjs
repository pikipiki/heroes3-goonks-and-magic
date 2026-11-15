import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('source tile masks restore scenery under new heroes without resurrecting removed objects',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-terrain-'));
 try{const binary=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignTerrain.test.cpp','-o',binary]);execFileSync(binary);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

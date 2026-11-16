import test from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
test('source HT packed keys preserve conditional variable indices, byte masks and the W32 alias',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-type-hints-'));
 try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignTypeHint.test.cpp','-o',bin]);execFileSync(bin);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

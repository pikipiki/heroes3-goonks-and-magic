import test from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{execFileSync}from'node:child_process';
test('original town downgrade table and signed dwelling count queries match their raw words',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-town-'));
 try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignTown.test.cpp','-o',bin]);execFileSync(bin);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

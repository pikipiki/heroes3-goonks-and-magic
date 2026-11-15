import test from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{execFileSync}from'node:child_process';
test('original chest field truncation, zero/negative choices and experience debt retain32bit source words',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-chest-'));
 try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignChest.test.cpp','-o',bin]);execFileSync(bin);}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

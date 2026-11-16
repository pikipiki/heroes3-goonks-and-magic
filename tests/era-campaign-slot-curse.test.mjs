import test from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{execFileSync}from'node:child_process';
test('pinned source slot curse encoding, slot mapping, inclusive expiry and byte wrap',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-slot-curse-'));try{const binary=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','tests/native/EraCampaignSlotCurse.test.cpp','-o',binary]);execFileSync(binary);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

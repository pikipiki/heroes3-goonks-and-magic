import {test} from 'node:test';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
test('A speculative spell deadline discards incomplete state, restores callers and stays local to its AI thread',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-spell-budget-'));
 try{const binary=path.join(directory,'budget');execFileSync(process.env.CXX||'clang++',['-std=c++17','-pthread','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/AutocombatSpellBudget.test.cpp','-o',binary],{stdio:'pipe'});execFileSync(binary,[],{stdio:'pipe',timeout:5000});}finally{fs.rmSync(directory,{recursive:true,force:true});}
});

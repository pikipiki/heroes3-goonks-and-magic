import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';

const root=path.resolve('work/vcmi-wasm');
const boost=process.env.GOONK_BOOST_INCLUDE||'/usr/include';
const available=process.platform==='linux'&&fs.existsSync(path.join(boost,'boost/version.hpp'));
test('campaign crossover preserves companion progression and life state but resets map-local stack experience',{
 skip:available?false:'Requires Linux compiler and Boost headers; also run with sanitizers in the engine build container'
},()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-henchmen-campaign-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-O0','-g','-ffunction-sections','-fdata-sections','-fsanitize=address,undefined',
   '-I'+root,'-I'+path.join(root,'lib'),'-I'+path.join(root,'include'),'-I'+boost,
   '-I'+(process.env.GOONK_TBB_INCLUDE||'/usr/include'),'tests/native/EraHenchmanCampaign.test.cpp',
   path.join(root,'lib/json/JsonNode.cpp'),'-Wl,--gc-sections','-o',binary],{timeout:180000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

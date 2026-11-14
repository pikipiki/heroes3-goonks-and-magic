import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = path.resolve('work/vcmi-wasm');
const boost = process.env.GOONK_BOOST_INCLUDE || '/usr/include';
const available = process.platform === 'linux' && fs.existsSync(path.join(boost,'boost/version.hpp'));
test('production campaign JSON state resumes without replay and rejects corrupt state', {
 skip: available ? false : 'Requires Linux native compiler and Boost headers; also checked in the WebAssembly build',
}, () => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(),'goonk-campaign-codec-'));
 try {
  const binary = path.join(dir,'test');
  const includes = [root,path.join(root,'lib'),path.join(root,'include'),boost];
  const modular = path.join(boost,'libs');
  if(fs.existsSync(modular))for(const entry of fs.readdirSync(modular)){
   const include = path.join(modular,entry,'include');
   if(fs.existsSync(include))includes.push(include);
  }
  execFileSync(process.env.CXX || 'c++', ['-std=c++17','-O0','-g','-ffunction-sections','-fdata-sections',
   '-fsanitize=address,undefined',...includes.map(include=>'-I'+include),
   'tests/native/EraCampaignRuntime.test.cpp',path.join(root,'lib/json/JsonNode.cpp'),
   path.join(root,'lib/era/EraCampaignRuntime.cpp'),'-Wl,--gc-sections','-o',binary],{timeout:180000});
  execFileSync(binary,{timeout:30000});
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

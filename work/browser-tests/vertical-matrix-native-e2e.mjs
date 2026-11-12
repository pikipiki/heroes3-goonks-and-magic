import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const catalog=JSON.parse(fs.readFileSync('outputs/combat-review/native-creatures.json'));
const failures=[],reports=[];const start=Number(process.env.START_BATCH||0),end=Number(process.env.END_BATCH||Infinity);
for(let offset=start*7;offset<catalog.length&&offset<end*7;offset+=7){const rows=catalog.slice(offset,offset+7),name='batch-'+String(offset/7).padStart(2,'0');try{
 const stdout=execFileSync(process.execPath,['work/browser-tests/vertical-complex-native-e2e.mjs'],{env:{...process.env,CASE_NAME:name,ROSTER:JSON.stringify(rows.map(u=>({type:u.key,amount:5})))},encoding:'utf8',timeout:180000,maxBuffer:2e6});
 reports.push({name,creatures:rows.map(u=>u.key),passed:true});console.log('PASS',name,rows.map(u=>u.key).join(', '));
 }catch(error){failures.push({name,creatures:rows.map(u=>u.key),error:String(error.stdout||error.message).slice(-2500)});console.log('FAIL',name,failures.at(-1).error);}}
fs.writeFileSync('outputs/combat-review/matrix-'+start+'.json',JSON.stringify({reports,failures},null,2)+'\n');if(failures.length)process.exitCode=1;

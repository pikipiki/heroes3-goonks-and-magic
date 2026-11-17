/** Reproducible inputs for separate ERA native ports. Never executes source code. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inventoryErm,sha256} from '../compatibility/erm-inventory.mjs';
import {sourcePacks,profileDefinitions,profileAdmission} from './profiles.mjs';

const projectRoot=fileURLToPath(new URL('../../../',import.meta.url));
const lockPath=path.join(projectRoot,'scripts/era-bridge/gameplay/reference-lock.json');
const upstreamCommit='233993be3eea4646b5c9f351e74f0bb51101adf6';

function files(root,prefix=''){
 return fs.readdirSync(path.join(root,prefix),{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)
  .flatMap(entry=>{
   const relative=prefix?prefix+'/'+entry.name:entry.name;
   if(entry.isSymbolicLink())throw Error('Symlink in upstream input: '+relative);
   return entry.isDirectory()?files(root,relative):entry.isFile()?[relative]:[];
  });
}

export function inventoryPack(root,{id,directory}){
 const directoryRoot=path.join(root,'Mods',directory);
 if(!fs.existsSync(directoryRoot))throw Error('Missing reference pack '+directory);
 const rows=files(directoryRoot).map(file=>{
  const bytes=fs.readFileSync(path.join(directoryRoot,file));
  const inactive=file.split('/').some(part=>part.toLowerCase()==='disabled');
  const row={file,sha256:sha256(bytes),bytes:bytes.length,inactiveDirectory:inactive};
  if(/\.erm$/i.test(file)){
   const inventory=inventoryErm(bytes,file);
   row.erm={triggers:inventory.triggerCount,postTriggers:inventory.postTriggerCount,
    commands:inventory.tokenCount,diagnostics:inventory.diagnostics,
    windowsDependencies:[...new Set(inventory.events.flatMap(event=>event.platformDependencies))].sort()};
  }
  if(/\.(dll|era)$/i.test(file))row.requiresNativeReplacement=true;
  if(/\.zip$/i.test(file))row.archiveRequiresInventory=true;
  return row;
 });
 return {id,directory,sha256:sha256(JSON.stringify(rows)),files:rows,
  status:'source-locked-not-native-admitted'};
}

export function buildReferenceInventory(root){
 const commit=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(commit!==upstreamCommit)throw Error('ERA reference commit changed; review before rebuilding lock');
 const packs=sourcePacks.map(pack=>inventoryPack(root,pack));
 const inventory={schema:1,upstream:{repository:'https://github.com/ERA-Projects/era-project-eng',commit},packs};
 return {...inventory,reborn:{status:'official-download-unavailable',version:'1.7.3',
  homepage:'https://www.h3wog.com/thread-78163-1-1.html',
  note:'Author page checked 2026-11-17. Official Baidu download is blocked by browser site policy; no package hash or source identity is asserted.'},
  profiles:profileDefinitions.map(profile=>profileAdmission(profile.id,inventory))};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),check=args.includes('--check');
 const roots=args.filter(arg=>arg!=='--check');
 if(roots.length>1||roots.some(arg=>arg.startsWith('--')))throw Error('Usage: reference.mjs [source-root] [--check]');
 const sourceRoot=path.resolve(roots[0]??path.join(projectRoot,'work/era-gameplay-reference'));
 const inventory=buildReferenceInventory(sourceRoot);
 const text=JSON.stringify(inventory,null,2)+'\n';
 if(check){if(fs.readFileSync(lockPath,'utf8')!==text)throw Error('Stale ERA gameplay source lock');}
 else fs.writeFileSync(lockPath,text);
 console.log(JSON.stringify({packs:inventory.packs.map(pack=>({id:pack.id,files:pack.files.length,
  scripts:pack.files.filter(file=>file.erm).length})),enabledProfiles:inventory.profiles.filter(profile=>profile.enabled).length}));
}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const digestBuffer=Buffer.allocUnsafe(1024*1024);
const digest = file => {
 const hash=crypto.createHash('sha256'),fd=fs.openSync(file,'r'),buffer=digestBuffer;
 try {let count;while((count=fs.readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,count));}
 finally {fs.closeSync(fd);}
 return hash.digest('hex');
};
const unchanged=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs;
function* walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())yield* walk(file);
  else if(entry.isFile())yield file;
 }
}

// Only generated, content-addressed assets in release snapshots are eligible.
// Never include source mods, saves, browser profiles, engines or the live dist.
export function dedupeLocalTestAssets(root,{apply=false,onProgress=()=>{}}={}){
 root=path.resolve(root);
 if(fs.lstatSync(root).isSymbolicLink())throw Error('Snapshot root must be a real directory');
 const canonical=new Map(),report={apply,snapshots:0,checkedFiles:0,duplicateFiles:0,alreadyShared:0,linkedFiles:0,duplicateBytes:0};
 for(const entry of fs.readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!entry.isDirectory()||!/^release\d+[a-z]?$/.test(entry.name))continue;
  const assets=path.join(root,entry.name,'assets');
  if(!fs.existsSync(assets)||fs.lstatSync(assets).isSymbolicLink())continue;
  report.snapshots++;
  for(const file of walk(assets)){
   const rel=path.relative(assets,file).split(path.sep).join('/');
   const match=/^(?:base|packs)\/([a-f0-9]{64})\.bin$/.exec(rel)||/^data\/([a-f0-9]{64})\/(?:Data|Maps|Mp3|Mods)\/.+/.exec(rel);
   if(!match)continue;
   const before=fs.lstatSync(file);if(!before.isFile())continue;
   if(digest(file)!==match[1])throw Error('Content hash mismatch: '+file);
   const after=fs.lstatSync(file);if(!unchanged(before,after))throw Error('Asset changed during verification: '+file);
   report.checkedFiles++;
   const key=[before.dev,before.mode,before.size,match[1]].join(':'),first=canonical.get(key);
   if(!first){canonical.set(key,{file,stat:after});continue;}
   const source=fs.lstatSync(first.file);
   // Linking changes ctime/link counts, but must never change the content.
   if(source.dev!==first.stat.dev||source.ino!==first.stat.ino||source.size!==first.stat.size||source.mtimeMs!==first.stat.mtimeMs)throw Error('Canonical asset changed: '+first.file);
   if(source.ino===after.ino){report.alreadyShared++;continue;}
   report.duplicateFiles++;report.duplicateBytes+=before.size;
   if(apply){
    const temp=file+'.dedupe-'+crypto.randomUUID();
    try{
     fs.linkSync(first.file,temp);
     if(!unchanged(after,fs.lstatSync(file)))throw Error('Asset changed before replacement: '+file);
     fs.renameSync(temp,file); // atomic: readers always see the same verified bytes
     report.linkedFiles++;
    }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
   }
  }
  onProgress({...report});
 }
 return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),root=args.find(a=>a.startsWith('--root='))?.slice(7);
 if(!root)throw Error('Usage: node scripts/dedupe-local-test-assets.mjs --root=work/campaign-validation217 [--apply] [--report=/tmp/report.json]');
 const report=dedupeLocalTestAssets(root,{apply:args.includes('--apply'),onProgress:r=>console.log(JSON.stringify(r))});
 const output=args.find(a=>a.startsWith('--report='))?.slice(9);if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}

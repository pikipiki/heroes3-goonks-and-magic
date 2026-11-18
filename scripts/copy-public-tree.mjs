import fs from 'node:fs';
import path from 'node:path';

// Build outputs are rewritten for caching. Materialize links so those writes
// cannot reach source files and published asset walkers see regular files.
export function copyPublicTree(source,destination){
 const sourceStat=fs.statSync(source);
 if(fs.lstatSync(destination,{throwIfNoEntry:false})?.isSymbolicLink())fs.unlinkSync(destination);
 if(sourceStat.isDirectory()){
  fs.mkdirSync(destination,{recursive:true});
  for(const name of fs.readdirSync(source))copyPublicTree(path.join(source,name),path.join(destination,name));
 }else if(sourceStat.isFile()){
  fs.rmSync(destination,{force:true});
  fs.copyFileSync(source,destination);
 }else throw Error('Unsupported public source file: '+source);
}

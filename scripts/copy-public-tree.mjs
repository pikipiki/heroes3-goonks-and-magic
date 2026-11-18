import fs from 'node:fs';

// Build outputs are rewritten for caching. Materialize links so those writes
// cannot reach source files and published asset walkers see regular files.
export function copyPublicTree(source,destination){
 fs.cpSync(source,destination,{recursive:true,dereference:true});
}

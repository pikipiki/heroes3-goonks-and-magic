import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const output=path.resolve('outputs/heroes-goonk-netlify-pages.zip');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.rmSync(output,{force:true});
execFileSync('zip',['-q','-r',output,'.'],{cwd:'dist',stdio:'inherit'});
console.log('Archive prête à déployer : '+output);

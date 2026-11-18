import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const hooks=execFileSync('git',['rev-parse','--git-path','hooks'],{encoding:'utf8'}).trim();
const target=path.join(hooks,'pre-commit'),source=fs.readFileSync('.githooks/pre-commit');
if(fs.existsSync(target)&&!fs.readFileSync(target).equals(source)){
 const backup=target+'.before-ui';if(fs.existsSync(backup))throw Error('Existing UI hook backup must be reviewed before installation');fs.copyFileSync(target,backup);fs.chmodSync(backup,0o755);
}
fs.mkdirSync(hooks,{recursive:true});fs.writeFileSync(target,source);fs.chmodSync(target,0o755);console.log('UI component hook installed; existing Graphify hooks preserved.');

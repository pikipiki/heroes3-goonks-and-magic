import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
process.chdir(project);
const root=path.join(os.tmpdir(),'heroes-real-ui-engine');
if(!fs.existsSync(path.join(root,'html5/vcmiclient.wasm'))){
 fs.mkdirSync(root,{recursive:true});
 execFileSync('tar',['-xf','outputs/vcmi-wasm-goonk-0.4.272-engine.tar.gz','-C',root]);
}
for(const file of ['real-preview.html','real-prototype.css'])fs.copyFileSync(path.join(project,'docs/design-prototypes/material3',file),path.join(root,'html5',file));
const port=process.env.PORT||'8941';
console.log(`Aperçu réel : http://127.0.0.1:${port}/real-preview.html`);
const child=spawn(process.execPath,['work/browser-tests/server.mjs'],{cwd:project,env:{...process.env,PORT:port,GOONK_ENGINE_DIR:path.join(root,'html5')},stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??0));

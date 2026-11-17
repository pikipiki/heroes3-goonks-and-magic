import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

test('The published engine archive extracts into the html5 directory expected by prepare:web',()=>{
 const source=fs.readFileSync('scripts/prepare-web.mjs','utf8');
 const archive=source.match(/const archive='([^']+)'/)[1];
 const entries=new Set(execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).trim().split('\n').map(p=>p.replace(/^\.\//,'')));
 for(const file of ['vcmiclient.wasm','vcmiclient.js','vcmiclient.data','game.html'])assert(entries.has('html5/'+file),'Missing html5/'+file+' in '+archive);
});

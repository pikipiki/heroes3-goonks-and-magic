// Run AFTER the normal site build; no changes to the public entry point.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
if (!fs.existsSync(dist + 'game.html')) throw Error('Run npm run build:web first');
fs.rmSync(dist+'crossover',{recursive:true,force:true});
fs.cpSync(new URL('./public/', import.meta.url), dist + 'crossover', {recursive:true});
const headers = dist + '_headers';
const marker = '# crossover experiment';
const existing = fs.readFileSync(headers, 'utf8').split(marker)[0].trimEnd();
fs.writeFileSync(headers, existing + '\n' + marker + '\n' + `/crossover/*\n  Content-Security-Policy: script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; base-uri 'self'; frame-src 'self'\n`);
console.log('Experimental launcher added to dist/crossover/index.html');

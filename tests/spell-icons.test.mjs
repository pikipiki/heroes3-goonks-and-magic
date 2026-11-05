import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import icons from '../web/spell-icons-data.mjs';
import {spellIconURL} from '../web/spell-icons.mjs';
test('All original spell icons are available without a per-icon network request',()=>{
 const directory=new URL('../web/h3-theme/spells/',import.meta.url),files=fs.readdirSync(directory).filter(name=>/^\d+\.png$/.test(name));
 assert.equal(Object.keys(icons).length,files.length);
 for(const name of files){const url=spellIconURL(parseInt(name));assert.match(url,/^data:image\/png;base64,/);assert.deepEqual(Buffer.from(url.split(',')[1],'base64'),fs.readFileSync(new URL(name,directory)),name);}
});
test('Unknown mod spell icons retain the existing external fallback',()=>{assert.equal(spellIconURL(999),'./web/h3-theme/spells/999.png');});

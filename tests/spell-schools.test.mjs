import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{spellSchoolIds,spellSchoolIndex}from'../web/spell-schools.mjs';
test('Every mobile school tab matches the IDs published by the compiled native engine',()=>{
 const source=fs.readFileSync(new URL('../work/vcmi-wasm/lib/constants/EntityIdentifiers.cpp',import.meta.url),'utf8');
 const order=['ANY','AIR','EARTH','FIRE','WATER'];
 order.forEach((name,index)=>{const native=source.match(new RegExp('SpellSchool::'+name+'\\((-?\\d+)\\)'));assert(native,name);const id=Number(native[1]);assert.equal(spellSchoolIds[index],id,name+' active tab');assert.equal(spellSchoolIndex(id),index,name+' reuse navigation');});
 assert.equal(spellSchoolIndex(999),-1,'Unknown schools must not silently select All');
});

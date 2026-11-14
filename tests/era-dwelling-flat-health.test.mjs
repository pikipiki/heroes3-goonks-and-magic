import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{SOURCE_DWELLING_FLAT_HEALTH as values,sourceDwellingFlatHealthRows}from'../scripts/era-bridge/objects/source-dwelling-flat-health.mjs';
// Mirror CCreatureHandler::loadStackExperience: numeric values emit cumulative
// deltas at inclusive lower bounds; ERA booleans emit disjoint [first,upper).
function load(rows){const bonuses=[];for(const row of rows){if(typeof row.values[0]==='boolean'){let first=0,rank=1;for(const enabled of row.values){if(enabled&&!first)first=rank;else if(!enabled&&first){bonuses.push({...row.bonus,min:first,max:rank});first=0;}++rank;}if(first)bonuses.push({...row.bonus,min:first,max:255});}else{let prior=0,rank=1;for(const val of row.values){if(val!==prior)bonuses.push({...row.bonus,val:val-prior,min:rank,max:255});prior=val;++rank;}}}return bonuses;}
function atRank(bonuses,rank){const grouped=new Map();for(const b of bonuses.filter(b=>rank>=b.min&&rank<b.max)){const prior=grouped.get(b.stacking);if(!prior||prior.val<b.val)grouped.set(b.stacking,b);}return[...grouped.values()];}
test('H+ absolute boolean rank carriers avoid numeric-delta stacking loss at all ten ranks',()=>{
 const rows=sourceDwellingFlatHealthRows([...values]),bad=load([{bonus:rows[0].bonus,values:values.slice(1)}]);
 assert.equal(atRank(bad,10)[0].val,2,'Prior numeric/tag encoding produces observed25+2=27');
 const loaded=load(rows);assert.equal(rows.length,10);assert.deepEqual(atRank(loaded,0),[]);
 for(let rank=1;rank<=10;++rank){const current=atRank(loaded,rank);assert.equal(current.length,1);assert.equal(current[0].val,values[rank]);assert.equal(25+current[0].val,25+values[rank]);}
 assert.equal(atRank(loaded,11)[0].val,14,'Post-cap ranks keep the final original value');
 for(const changed of [[0,1,2],values.map((v,i)=>i===10?v+1:v)])assert.throws(()=>sourceDwellingFlatHealthRows(changed),/Changed dwelling/);
 const loader=fs.readFileSync('work/vcmi-wasm/lib/CCreatureHandler.cpp','utf8');assert.match(loader,/val\.Integer\(\) - lastVal/);assert.match(loader,/addRange\(firstRank, rank\)/);
});

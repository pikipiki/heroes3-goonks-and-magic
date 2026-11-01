import test from 'node:test';import assert from 'node:assert/strict';
import {readSpellCatalogue} from '../scripts/era-bridge/artifacts/spell-catalogue.mjs';
import {compileArtifact} from '../scripts/era-bridge/artifacts/artifacts.mjs';
const line=(name,level)=>[name,name,String(level),' ',' ',' ',' ',...Array(22).fill('0'),'"description'].join('\t');
const source=()=>Array.from({length:81},(_,i)=>line(i===0?'Summon Boat':i===69?'Air Elemental':'Spell'+i,i%5+1));
test('spell catalogues keep the source0..69 boundary despite multiline prose',()=>{
 const text=source();text.splice(4,0,'unmatched narrative quote "','text\tthat\t1');const rows=readSpellCatalogue(text.join('\n'));assert.equal(rows.length,70);assert.equal(rows[69].name,'Air Elemental');
 const result=compileArtifact({id:192,text:'GivesSpellSet=9',spellCatalogue:rows,resolveSpell:id=>'core:spell'+id});assert(result.ok);assert.equal(Object.keys(result.patch.bonuses).length,14);assert(!result.patch.bonuses.givenSpell70);
});
test('missing descriptor or reordered source identity cannot produce a shifted catalogue',()=>{
 const rows=source();rows.splice(5,1);assert.throws(()=>readSpellCatalogue(rows.join('\n')),/identity|sequence/);assert.throws(()=>readSpellCatalogue(source().slice(0,69).join('\n')),/identity|sequence/);
});
import fs from 'node:fs';
test('the shipped original table retains the correct level catalogue and creature-spell boundary',()=>{
 const rows=readSpellCatalogue(fs.readFileSync(new URL('./fixtures/tum/SPTRAITS.original.txt',import.meta.url),'latin1'));
 assert.equal(rows[0].level,1);assert.equal(rows[15].name,'Magic Arrow');assert.equal(rows[15].level,1);assert.equal(rows[69].level,5);assert.equal(rows.length,70);
 for(let level=1;level<=4;level++){
  const result=compileArtifact({id:191+level,text:'GivesSpellSet='+(8+level),spellCatalogue:rows,resolveSpell:id=>'core:spell'+id});assert(result.ok);
  assert.deepEqual(Object.keys(result.patch.bonuses).map(s=>Number(s.replace('givenSpell',''))),rows.filter(s=>s.level===level).map(s=>s.id));
 }
});

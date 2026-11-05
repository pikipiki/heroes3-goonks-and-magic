import test from 'node:test';import assert from 'node:assert/strict';import {heroManaText,heroMovementSummary} from '../web/hero-movement.mjs';
test('Mana displays zero, its limit and overcharged values without confusing movement points',()=>{assert.equal(heroManaText(0,10),'Mana 0/10');assert.equal(heroManaText(999,10),'Mana 999/10');assert.equal(heroManaText(5,20,'fr'),'Magie 5/20');assert.equal(heroManaText(undefined,10),'');});
test('Each hero shows its own mana and movement, including the selected-hero fallback',()=>{const s={heroName:'Pyre',movement:461,heroMana:0,heroManaLimit:10,turn:true};assert.match(heroMovementSummary(s),/461 MP/);assert.match(heroMovementSummary(s),/Mana 0\/10/);const html=heroMovementSummary({...s,heroes:[{name:'Pyre',movement:461,mana:0,manaLimit:10},{name:'Solmyr',movement:1500,mana:25,manaLimit:30}]});assert.match(html,/Mana 0\/10/);assert.match(html,/Mana 25\/30/);});

test('Only the selected hero is marked when two heroes have the same display name',()=>{
 const html=heroMovementSummary({heroId:42,heroName:'Iona',turn:true,heroes:[
  {id:7,index:0,name:'Iona',movement:500},
  {id:42,index:1,name:'Iona',movement:1000}
 ]});
 assert.match(html,/data-hero-index="0" aria-pressed="false"/);
 assert.match(html,/data-hero-index="1" aria-pressed="true"[^>]*><span class="hero-selected-mark"/);
 assert.equal((html.match(/class="hero-selected-mark"/g)||[]).length,1);
});

test('The no-spellbook badge is independent of mana and hero selection',()=>{
 const state={heroId:1,heroName:'Rion',turn:true,heroes:[
  {id:1,name:'Rion',mana:20,manaLimit:20,hasSpellbook:false},
  {id:2,name:'Catherine',mana:0,manaLimit:10,hasSpellbook:false},
  {id:3,name:'Solmyr',mana:0,manaLimit:30,hasSpellbook:true},
  {id:4,name:'Astral',mana:5,manaLimit:15}
 ]};
 const html=heroMovementSummary(state);
 assert.match(html,/Rion.*?Mana 20\/20<\/span><span class="hero-no-spellbook">No spellbook/);
 assert.match(html,/Catherine.*?Mana 0\/10<\/span><span class="hero-no-spellbook">No spellbook/);
 assert.equal((html.match(/No spellbook/g)||[]).length,2);
 assert.equal((heroMovementSummary(state,'fr').match(/Sans grimoire/g)||[]).length,2);
 assert.match(heroMovementSummary({heroName:'Rion',heroHasSpellbook:false}),/No spellbook/);
});

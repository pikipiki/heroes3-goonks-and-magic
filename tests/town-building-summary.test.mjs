import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildingFunctionSummary} from '../web/town-building-summary.mjs';
import {constructionCatalogue,factions} from '../work/browser-tests/construction-catalogue.mjs';
test('Functional summaries remain three or four full words in both languages across ten factions',()=>{
 for(const faction of factions)for(const building of constructionCatalogue(faction).buildings)for(const language of ['fr','en']){
  const text=buildingFunctionSummary(building,faction,language),words=text.split(/\s+/);
  assert(words.length>=3&&words.length<=4,[faction,building.key,language,text].join(':'));
  assert(!text.includes('…')&&!text.includes('...'));
 }
});
test('Building functions are translated effects, independent of native description truncation',()=>{
 const summary=(key,faction,language)=>buildingFunctionSummary({key:'core:'+key,description:'Arbitrarily long description…'},faction,language);
 assert.equal(summary('tavern','castle','fr'),'Recrutement de héros');
 assert.equal(summary('mageGuild5','tower','en'),'Learn new spells');
 assert.equal(summary('marketplace','rampart','fr'),'Échange de ressources');
 assert.equal(summary('special2','dungeon','fr'),'Double le mana');
 assert.equal(summary('special3','rampart','en'),'Weekly gold interest');
 assert.equal(summary('dwellingUp2Lvl7','fortress','fr'),'Recrutement de créatures');
});

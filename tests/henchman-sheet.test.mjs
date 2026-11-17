import test from 'node:test';
import assert from 'node:assert/strict';
import {renderHenchmanSheet} from '../web/henchman-sheet.mjs';
import {setLanguage} from '../web/i18n.mjs';
setLanguage('fr');
const hero={henchman:{revision:1,unit:{name:'<Peasant>',attack:1,defense:1,damageMin:2,damageMax:3,health:51,speed:3},alive:false,level:1,experience:0,nextLevel:10,resurrectionCost:20,canResurrect:true,candidates:[{slot:0,name:'Paysan',available:true},{slot:1,name:'Émissaire',available:false}]}};
test('Henchman sheet exposes native resurrection cost, progression, candidates and escaped names',()=>{
 const markup=renderHenchmanSheet(hero,{canAct:true});
 assert(markup.includes('&lt;Peasant&gt;'));assert(!markup.includes('<Peasant>'));
 assert(markup.includes('20 or'));assert(markup.includes('10 XP avant'));
 assert.match(markup,/data-henchman-action="2"\s+>/);
 assert.match(markup,/data-henchman-slot="1"[^>]* disabled/);
});
test('Henchman requests disable mutations while pending and cannot expose resurrection for living units',()=>{
 assert.match(renderHenchmanSheet(hero,{canAct:true,pending:true}),/data-henchman-action="2" disabled/);
 assert.match(renderHenchmanSheet(hero,{canAct:false}),/data-henchman-action="1" disabled/);
 const living=structuredClone(hero);living.henchman.alive=true;
 assert(!renderHenchmanSheet(living,{canAct:true}).includes('data-henchman-action="2"'));
 assert.equal(renderHenchmanSheet({}), '');
});

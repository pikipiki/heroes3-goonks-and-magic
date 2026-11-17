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
test('Banner ownership and all nine styles use native availability and existing revisioned actions',()=>{
 const equipped=structuredClone(hero);
 Object.assign(equipped.henchman,{bannerEnabled:true,bannerStyle:7,canReturnBanner:true});
 const markup=renderHenchmanSheet(equipped,{canAct:true});
 assert.equal((markup.match(/data-henchman-action="4"/g)||[]).length,9);
 assert.match(markup,/data-henchman-slot="7" aria-pressed="true" disabled/);
 assert.match(markup,/data-henchman-action="5"\s+>/);
 assert.match(renderHenchmanSheet(equipped,{canAct:true,pending:true}),/data-henchman-action="5" disabled/);
 Object.assign(equipped.henchman,{bannerStyle:-1,canEquipBanner:false});
 assert.match(renderHenchmanSheet(equipped,{canAct:true}),/data-henchman-action="3" disabled/);
 equipped.henchman.canEquipBanner=true;
 assert.match(renderHenchmanSheet(equipped,{canAct:true}),/data-henchman-action="3"\s+>/);
});

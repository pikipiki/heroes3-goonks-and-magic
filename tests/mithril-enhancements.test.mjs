import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMithrilOffers} from '../web/mithril-enhancements.mjs';
test('Mithril site list escapes names and keeps server eligibility authoritative',()=>{
 const html=renderMithrilOffers({amount:9,offers:[{id:4,name:'<mine>',x:1,y:2,kind:0,cost:4,available:true},{id:5,name:'Allied mill',x:2,y:2,kind:2,cost:5,available:false}]},{canAct:true});
 assert(html.includes('&lt;mine&gt;'));assert(!html.includes('<mine>'));
 assert.match(html,/data-mithril-buy="4"[^>]*>[^<]*4 Mithril/);
 assert.match(html,/data-mithril-buy="5"[^>]*disabled/);
 assert.match(renderMithrilOffers({offers:[{id:1,available:true,cost:4}]},{canAct:true,pending:true}),/data-mithril-buy="1"[^>]*disabled/);
 const conflux=renderMithrilOffers({offers:[{id:7,kind:1,upgrade:'old name',upgrades:['Storm Elementals','Ice Elementals','Energy Elementals','<Magma>'],cost:4,available:true}]},{canAct:true});
 for(const name of ['Storm Elementals','Ice Elementals','Energy Elementals','&lt;Magma&gt;'])assert(conflux.includes(name));
 assert(!conflux.includes('old name'));assert(!conflux.includes('<Magma>'));
 const protectedMine=renderMithrilOffers({offers:[{id:3,kind:0,protection:true,cost:5,available:true}]},{canAct:true});
 assert.match(protectedMine,/prochain changement hebdomadaire|next weekly resource change/);
 assert.doesNotMatch(protectedMine,/Production doublée|Double production/);
});
test('Active mines display remaining duration without another purchase',()=>{
 const html=renderMithrilOffers({amount:5,offers:[{id:1,kind:0,active:true,days:7}]},{canAct:true});
 assert(html.includes('7'));assert(!html.includes('data-mithril-buy'));
});
test('A town uses one touch-friendly terrain picker with nine server-priced choices',()=>{
 const offers=Array.from({length:9},(_,choice)=>({id:7,name:'Town',x:1,y:2,kind:8,choice,cost:choice<7?1:3,available:choice<7}));
 const html=renderMithrilOffers({amount:2,offers},{canAct:true,selectedTerrains:{7:8}});
 assert.equal((html.match(/<article>/g)||[]).length,1);
 assert.equal((html.match(/<option /g)||[]).length,9);
 assert.match(html,/data-mithril-terrain="7"/);
 assert.match(html,/<option value="8" selected/);
 assert.match(html,/data-mithril-buy="7" data-mithril-choice="8" disabled/);
 const first=renderMithrilOffers({amount:2,offers},{canAct:true});
 assert.match(first,/data-mithril-buy="7" data-mithril-choice="0" >[^<]*1 Mithril/);
 assert.match(renderMithrilOffers({offers},{canAct:true,pending:true}),/<select[^>]*disabled/);
});

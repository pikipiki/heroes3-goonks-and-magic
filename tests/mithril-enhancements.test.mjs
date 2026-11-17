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
});
test('Active mines display remaining duration without another purchase',()=>{
 const html=renderMithrilOffers({amount:5,offers:[{id:1,kind:0,active:true,days:7}]},{canAct:true});
 assert(html.includes('7'));assert(!html.includes('data-mithril-buy'));
});

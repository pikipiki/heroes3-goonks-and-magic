import {test} from 'node:test';import assert from 'node:assert/strict';
import {cheatCodes,unavailableReason} from '../web/cheat-codes.mjs';
test('Cheats respect game options, turns and selected targets',()=>{
 const ready={cheatReady:true,cheatsAllowed:true};
 const hero=cheatCodes.find(x=>x.target==='hero'),town=cheatCodes.find(x=>x.target==='town'),player=cheatCodes.find(x=>x.target==='player');
 assert.equal(unavailableReason(player,ready),'');
 assert.match(unavailableReason(player,{...ready,cheatsAllowed:false}),/désactivés/);
 assert.match(unavailableReason(player,{...ready,cheatReady:false}),/tour/);
 assert.match(unavailableReason(hero,ready),/héros/);
 assert.equal(unavailableReason(hero,{...ready,heroName:'Gardien'}),'');
 assert.match(unavailableReason(town,ready),/ville/);
 assert.equal(unavailableReason(town,{...ready,townName:'Goonkbourg'}),'');
});

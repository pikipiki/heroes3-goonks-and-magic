import test from 'node:test';
import assert from 'node:assert/strict';
import {highScorePresentation} from '../web/high-score-presentation.mjs';
test('campaign ending shows native completion, score and editable player name',()=>{
 const source={won:true,campaign:true,completedScenarios:3,days:42,score:300,unranked:false,name:'Gorynych',playerName:'Player',queryId:42};
 const view=highScorePresentation(source,'fr');
 assert.equal(view.title,'Victoire !');assert.ok(view.lines.includes('3 scénarios terminés'));
 assert.deepEqual(view.scriptDialog.draft,{text:'Player',selection:0});assert.equal(view.scriptDialog.queryId,42);
 assert.deepEqual(highScorePresentation(source,'fr'),view);
 assert.equal(source.playerName,'Player');
});
test('defeat has one continue action and no score entry form',()=>{
 const view=highScorePresentation({won:false,campaign:false,days:2,score:0,unranked:true});
 assert.equal(view.title,'Defeat');assert.equal(view.scriptDialog,undefined);
 assert.ok(view.lines.includes('Game with cheats'));assert.ok(!view.lines.some(s=>s.includes('scenarios completed')));
});

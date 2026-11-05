import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSessionRecovery,listLocalSaves} from '../web/session-recovery.mjs';
function fixture(candidates=[{name:'goonk-auto'}]){let now=0;const commands=[],statuses=[];const r=createSessionRecovery({listSaves:()=>candidates,command:(...v)=>commands.push(v),onStatus:s=>statuses.push(s),clock:()=>now});return{r,commands,statuses,set now(v){now=v;}};}
test('Boot resumes the most recent compatible save once, only after selection acknowledgement',()=>{
 const {r,commands}=fixture([{name:'new-corrupt'},{name:'manual-latest'},{name:'goonk-auto'}]);
 r.update({mode:'menu'});r.update({mode:'menu'});assert.deepEqual(commands,[[23]]);
 r.update({mode:'load',lobbyReady:false});assert.equal(commands.length,1);
 const saves={mode:'load',lobbyReady:true,maps:[{index:0,name:'Goonk-auto'},{index:1,name:'Manual-latest'}],selectedIndex:0};
 r.update(saves);assert.deepEqual(commands.at(-1),[27,1]);
 r.update(saves);assert.equal(commands.length,2);
 r.update({...saves,selectedIndex:1});assert.deepEqual(commands.at(-1),[22]);
 r.update({...saves,selectedIndex:1});r.update({mode:'menu'});assert.equal(commands.length,3);
 r.update({mode:'map',day:2,heroId:4});assert.equal(r.phase,'done');
 for(let i=0;i<3;i++){r.wake();r.update({mode:'map',day:2});}r.update({mode:'menu'});assert.equal(commands.length,3);
});
test('No saved game, already running game, and a deliberate lobby never trigger resume',()=>{
 for(const [state,candidates]of [[{mode:'menu'},[]],[{mode:'map',day:1},[{name:'auto'}]],[{mode:'lobby'},[{name:'auto'}]]]){const {r,commands}=fixture(candidates);r.update(state);assert.equal(r.phase,'done');assert.deepEqual(commands,[]);}
});
test('Cancel, absent/corrupt saves and timeout do not loop or double-start',()=>{
 const f=fixture();f.r.update({mode:'menu'});assert(f.r.dismiss());f.r.update({mode:'load',lobbyReady:true});assert.deepEqual(f.commands,[[23]]);
 const missing=fixture();missing.r.update({mode:'menu'});missing.r.update({mode:'load',lobbyReady:true,maps:[]});assert.equal(missing.r.phase,'failed');assert(!missing.r.intercept);
 const timeout=fixture();timeout.r.update({mode:'menu'});timeout.now=120000;timeout.r.wake();timeout.r.tick();assert.equal(timeout.r.phase,'opening');timeout.now=181000;timeout.r.tick();assert.equal(timeout.r.phase,'failed');assert.equal(timeout.commands.length,1);
});
test('Local save listing sorts timestamps, filters non-saves and empty files and tolerates missing storage',()=>{
 const stats={'manual.vsgm1':{size:20,mtime:new Date(30)},'Goonk-auto.vsgm1':{size:20,mtime:new Date(10)},'partial.vsgm1':{size:0,mtime:new Date(40)}};
 assert.deepEqual(listLocalSaves({readdir:()=>[...Object.keys(stats),'settings.json'],stat:p=>stats[p.split('/').at(-1)]}),[{name:'manual',modified:30},{name:'goonk-auto',modified:10}]);assert.deepEqual(listLocalSaves(),[]);
});

test('Choosing another save during startup stays enabled and stops further automatic starts',()=>{
 const commands=[],choices=[],statuses=[];const r=createSessionRecovery({listSaves:()=>[{name:'auto'}],command:(...args)=>commands.push(args),onStatus:s=>statuses.push(s),onChooseAlternative:info=>choices.push(info)});
 r.update({mode:'menu'});const load={mode:'load',lobbyReady:true,maps:[{index:0,name:'auto'}],selectedIndex:0};r.update(load);r.update(load);
 assert.equal(r.phase,'starting');assert(statuses.at(-1).canDismiss);assert(r.dismiss());assert.deepEqual(choices,[{restarting:true}]);r.update(load);assert.equal(commands.filter(c=>c[0]===22).length,1);assert(!r.intercept);
 const manual=[];const next=createSessionRecovery({manual:true,listSaves:()=>{throw Error('Automatic selection must be skipped');},command:(...args)=>manual.push(args)});next.update({mode:'menu'});next.update(load);assert.deepEqual(manual,[[23]]);assert.equal(next.phase,'dismissed');
});

test('A deliberate new game skips automatic recovery without deleting saved games',()=>{const commands=[];const r=createSessionRecovery({newGame:true,listSaves:()=>{throw Error('Should not select an old save');},command:(...args)=>commands.push(args)});r.update({mode:'menu'});r.update({mode:'menu'});assert.deepEqual(commands,[[20]]);assert(!r.intercept);});
test('Custom hotseat settings wait for lobby acknowledgement before being exposed',()=>{const commands=[];const options=[4,2,144,1,-1];const r=createSessionRecovery({custom:options,listSaves:()=>[],command:(...args)=>commands.push(args)});r.update({mode:'menu'});assert.deepEqual(commands,[[20,2]]);assert(r.intercept);r.update({mode:'lobby',lobbyReady:false});assert.equal(commands.length,1);r.update({mode:'lobby',lobbyReady:true});assert.deepEqual(commands.at(-1),[48,...options]);assert(r.intercept);r.update({mode:'lobby',lobbyReady:true,customMap:true});assert(!r.intercept);r.update({mode:'lobby',lobbyReady:true,customMap:true});assert.equal(commands.length,2);});

test('A campaign retry opens campaigns once instead of restoring a saved game',()=>{const commands=[];const r=createSessionRecovery({campaign:true,listSaves:()=>{throw Error('No automatic save selection');},command:(...args)=>commands.push(args)});r.update({mode:'menu'});r.update({mode:'menu'});assert.deepEqual(commands,[[47]]);});

test('Boot recovery leaves the latest online checkpoint for a multiplayer room',()=>{
 const {r,commands}=fixture([{name:'goonk-online-auto',modified:30}]);
 r.update({mode:'menu'});
 assert.deepEqual(commands,[]);
 assert.equal(r.phase,'done');
});

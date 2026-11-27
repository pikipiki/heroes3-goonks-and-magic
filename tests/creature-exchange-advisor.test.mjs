import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adviseCreatureExchange, scoreCreatureStack} from '../web/creature-exchange-advisor.mjs';

const makeUnit=(overrides)=>({
 id:1,slot:0,name:'Piquier',count:10,attack:4,defense:5,damageMin:1,damageMax:3,health:10,speed:4,
 fightValue:80,aiValue:80,shooter:false,shots:0,abilities:[],nativeFlags:{living:true},
 ...overrides
});

test('recommends merging when the hero already owns the same creature',()=>{
 const archer=makeUnit({id:2,slot:2,name:'Archer',count:12,attack:6,defense:3,damageMin:2,damageMax:3,health:10,speed:4,shooter:true,shots:12,fightValue:126});
 const candidate=makeUnit({id:2,slot:0,name:'Archer',count:8,attack:6,defense:3,damageMin:2,damageMax:3,health:10,speed:4,shooter:true,shots:12,fightValue:126});
 const roster=[makeUnit({id:1,slot:0}),makeUnit({id:3,slot:1,name:'Griffon'}),archer];
 const advice=adviseCreatureExchange(candidate,roster,'fr');
 assert.equal(advice.verdict,'recommended');
 assert.equal(advice.action,'merge');
 assert.equal(advice.targetSlot,2);
 assert.match(advice.headline,/fusionner/i);
});

test('recommends swapping the weakest slot in a full 7-slot army for a stronger stack',()=>{
 const weak=makeUnit({id:10,slot:4,name:'Lutin',count:6,attack:2,defense:3,damageMin:1,damageMax:2,health:4,speed:5,fightValue:50});
 const roster=[
  makeUnit({id:1,slot:0,name:'Croisé',count:20,attack:12,defense:12,damageMin:7,damageMax:10,health:35,speed:6,fightValue:558}),
  makeUnit({id:2,slot:1,name:'Griffon royal',count:18,attack:9,defense:9,damageMin:3,damageMax:6,health:25,speed:9,fightValue:364,nativeFlags:{living:true,flying:true}}),
  makeUnit({id:3,slot:2,name:'Arbalétrier',count:25,attack:6,defense:3,damageMin:2,damageMax:3,health:10,speed:6,shooter:true,shots:24,fightValue:184}),
  makeUnit({id:4,slot:3,name:'Moine',count:12,attack:12,defense:7,damageMin:10,damageMax:12,health:30,speed:5,shooter:true,shots:12,fightValue:485}),
  weak,
  makeUnit({id:5,slot:5,name:'Cavalier',count:8,attack:15,defense:15,damageMin:15,damageMax:25,health:100,speed:7,fightValue:1668}),
  makeUnit({id:6,slot:6,name:'Ange',count:3,attack:20,defense:20,damageMin:50,damageMax:50,health:200,speed:12,fightValue:5019,nativeFlags:{living:true,flying:true}})
 ];
 const candidate=makeUnit({id:99,slot:0,name:'Licorne',count:10,attack:15,defense:14,damageMin:18,damageMax:22,health:90,speed:7,fightValue:1444,abilities:['Aveuglement','Aura de résistance magique']});
 const advice=adviseCreatureExchange(candidate,roster,'fr');
 assert.equal(advice.verdict,'recommended');
 assert.equal(advice.action,'swap');
 assert.equal(advice.targetSlot,4);
 assert.equal(advice.targetUnit.name,'Lutin');
 assert.ok(advice.netDelta>0);
});

test('marks a weaker candidate as not-recommended against a strong full army',()=>{
 const roster=Array.from({length:7},(_,i)=>makeUnit({id:i+1,slot:i,name:`Dragon ${i+1}`,count:5,attack:20,defense:20,damageMin:40,damageMax:50,health:200,speed:11,fightValue:4000}));
 const weakCandidate=makeUnit({id:88,slot:0,name:'Paysan',count:4,attack:1,defense:1,damageMin:1,damageMax:1,health:1,speed:3,fightValue:15});
 const advice=adviseCreatureExchange(weakCandidate,roster,'fr');
 assert.equal(advice.verdict,'not-recommended');
 assert.equal(advice.action,'swap');
 assert.ok(advice.netDelta<0);
});

test('accounts for undead morale penalty, map speed slowdown, and first shooter synergy',()=>{
 const fastLiving=Array.from({length:7},(_,i)=>makeUnit({id:i+1,slot:i,name:`Centaure ${i+1}`,count:10,attack:8,defense:5,damageMin:3,damageMax:5,health:14,speed:8,fightValue:180,nativeFlags:{living:true}}));
 const slowUndead=makeUnit({id:50,slot:0,name:'Zombie',count:10,attack:5,defense:5,damageMin:2,damageMax:3,health:20,speed:4,fightValue:128,nativeFlags:{undead:true,living:false}});
 const undeadAdvice=adviseCreatureExchange(slowUndead,fastLiving,'fr');
 assert.ok(undeadAdvice.reasons.some(r=>/moral/i.test(r)));
 assert.ok(undeadAdvice.reasons.some(r=>/vitesse/i.test(r)));

 const firstShooter=makeUnit({id:60,slot:0,name:'Elfe',count:10,attack:9,defense:5,damageMin:3,damageMax:5,health:15,speed:6,shooter:true,shots:24,fightValue:234,abilities:['Tire deux fois']});
 const shooterAdvice=adviseCreatureExchange(firstShooter,fastLiving,'fr');
 assert.equal(shooterAdvice.verdict,'recommended');
 assert.ok(shooterAdvice.reasons.some(r=>/premier tireur/i.test(r)));
 assert.ok(scoreCreatureStack(firstShooter).effectsMultiplier>1.2);
});

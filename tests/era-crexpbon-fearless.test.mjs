import test from 'node:test';
import assert from 'node:assert/strict';
import {compileCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
const compile=values=>compileCreatureExperience([{creature:265,code:'f',modifier:'f',values,source:'fearless-fixture',line:1}],{creatureId:265,installedRows:[],rankZero:'intrinsic',nativeExperienceProfile:true});
test('source ff grants zero fear ceiling at exact enabled ranks, including boolean2 off',()=>{
 const result=compile([0,0,0,0,2,1,1,1,1,1,1]);assert.equal(result.ok,true);
 const row=result.definition.stackExperience[0];assert.deepEqual(row.bonus,{type:'FEARFUL',val:0,valueType:'INDEPENDENT_MIN'});
 assert.equal(row.values[3],false);assert.equal(row.values[4],true);
 // ADDITIVE zero would leave an enemy fear10 aura effective; the independent minimum clamps it.
 assert.equal(Math.min(10,row.bonus.val),0);
});
test('source ff intrinsic rank zero retains the same absolute immunity contract',()=>{
 const result=compile(Array(11).fill(1));assert.equal(result.ok,true);
 assert.deepEqual(result.definition.abilities.crexp_0_rank0,{type:'FEARFUL',val:0,valueType:'INDEPENDENT_MIN'});
 assert.deepEqual(result.definition.stackExperience,[]);
});

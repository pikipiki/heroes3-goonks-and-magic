import {test} from 'node:test';import assert from 'node:assert/strict';import {recruitmentSummary} from '../web/recruitment-summary.mjs';
const base={recruitUnit:{count:14,cost:[0,0,0,0,0,0,98]},resources:[35,10,25,10,10,10,78],recruitMaximum:0,recruitAmount:0};
test('Available stock is distinct from affordable recruits and explains the exact missing gold',()=>{const text=recruitmentSummary(base);for(const part of ['Stock : 14','Recrutables : 0','Prix par unité : 98 or','Il manque 20 or pour une unité.'])assert(text.includes(part));assert(!text.includes('Total :'));});
test('A funded recruitment shows the selected total without claiming funds are missing',()=>{const text=recruitmentSummary({...base,resources:[0,0,0,0,0,0,500],recruitMaximum:5,recruitAmount:3});assert(text.includes('Recrutables : 5'));assert(text.includes('Total : 294 or'));assert(!text.includes('Il manque'));});
test('Special-resource shortages and an empty stock have distinct explanations',()=>{const state={...base,recruitUnit:{count:2,cost:[0,2,0,0,0,0,100]},resources:[0,1,0,0,0,0,90]};assert(recruitmentSummary(state).includes('Il manque 1 mercure + 10 or'));const empty=recruitmentSummary({...state,recruitUnit:{...state.recruitUnit,count:0}});assert(empty.includes('Stock épuisé'));assert(!empty.includes('Il manque'));});

test('Recruitment supports additional native resources such as mithril',()=>{const summary=recruitmentSummary({recruitUnit:{count:3,cost:[0,0,0,0,0,0,50,2]},resourceTypes:[{},{},{},{},{},{},{},{id:7,key:'mithril',name:'Mithril'}],resources:[0,0,0,0,0,0,50,1],recruitMaximum:0,recruitAmount:0});assert.match(summary,/mithril/i);assert.match(summary,/Il manque 1 mithril/);});

test('Compact recruitment keeps only the total and groups gold without shortening other resources',()=>{
 const state={recruitUnit:{count:12,cost:[9999,0,0,0,0,0,9999999]},resources:[99999,0,0,0,0,0,99999999],recruitMaximum:10,recruitAmount:1};
 assert.equal(recruitmentSummary(state,'en',{compact:true}),'Total: 9999 wood + 9 999 999 gold');
 assert.equal(recruitmentSummary(state,'fr',{compact:true}),'Total : 9999 bois + 9 999 999 or');
 assert.match(recruitmentSummary({...base,recruitAmount:0},'en',{compact:true}),/Missing 20 gold/);
});

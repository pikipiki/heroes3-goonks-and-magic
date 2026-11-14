import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {sourceSorceress316Services} from '../scripts/era-bridge/creatures/source-sorceress316.mjs';
test('Sorceress property admission preserves original death-cloud kernel',()=>{
 const original={name:'Death Cloud',levels:{none:{range:'0-1',battleEffects:{damage:{ignoreImmunity:true}}}}};
 const r=sourceSorceress316Services('isSorceress=1\nShot type=2',{deathCloudSpell:original});assert.equal(r.spells.sourceSorceressDeathCloud.levels.none.range,'0-1');assert.equal(original.name,'Death Cloud');assert.throws(()=>sourceSorceress316Services('isSorceress=0\nShot type=2',{deathCloudSpell:original}));
});
test('source weighted pools, filters and draw ordering are exact',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sorceress316-'));
 try{fs.writeFileSync(dir+'/test.cpp',`#include "${path.resolve('work/vcmi-wasm/lib/era/EraSorceress316Rule.h')}"
#include <cassert>
#include <algorithm>
int main(){using namespace era_bridge;
 for(int count:{1,9,10,19,20,49,50,100}){auto p=sorceressPool(count);int sum=0;for(auto c:p)sum+=c.weight;assert(sum==100);assert(p.size()==(count<10?4:count<20?7:count<50?11:15));}
 SorceressSnapshot s;s.targetPresent=true;s.count=50;s.shooter=true;s.shots=8;s.hasListedBuff=true;
 std::vector<std::pair<int,int>> calls;int draw=0;auto first=[&](int lo,int hi){calls.emplace_back(lo,hi);return ++draw==1?1:1;};
 assert(selectSorceress(s,first)==60);assert(calls.size()==2&&calls[0].second==100&&calls[1].second==100);
 s.alreadyActive[60]=true;draw=0;calls.clear();assert(selectSorceress(s,first)==62);assert(calls[1].second==96);
 s.orbInhibition=true;draw=0;calls.clear();assert(selectSorceress(s,first)==-1&&calls.size()==1);s.orbInhibition=false;
 s.targetSourceId=160;int rejection=0;draw=0;assert(selectSorceress(s,first,&rejection)==-1&&rejection==78);s.targetSourceId=-1;
 s.mirrorActive=true;s.mirrorThreshold=20;draw=0;assert(selectSorceress(s,first,&rejection)==-1&&rejection==3);s.mirrorActive=false;
 s.recanter=true;assert(!sorceressEligible(s,60)&&!sorceressEligible(s,73)&&sorceressEligible(s,54));s.orbVulnerability=true;assert(!sorceressEligible(s,60));
 s.recanter=false;s.noMorale=true;assert(!sorceressEligible(s,50));s.shooter=false;assert(!sorceressEligible(s,61));
 s.orbVulnerability=false;s.noMorale=false;s.undead=true;assert(!sorceressEligible(s,42)&&!sorceressEligible(s,75));assert(sorceressEligible(s,45));
 s.orbVulnerability=true;assert(sorceressEligible(s,42)&&sorceressEligible(s,75));s.undead=false;s.orbVulnerability=false;
 s.targetSourceId=27;assert(!sorceressEligible(s,54)&&sorceressEligible(s,75));s.targetSourceId=121;assert(!sorceressEligible(s,80));
 s.targetSourceId=-1;s.hasListedBuff=false;assert(!sorceressEligible(s,78));s.hasListedBuff=true;assert(sorceressEligible(s,78));
 // Preserve all100 original selection boundaries for a fully eligible target.
 s=SorceressSnapshot{};s.count=50;s.targetPresent=true;s.shooter=true;s.shots=8;s.hasListedBuff=true;
 auto pool=sorceressPool(50);for(int roll=1;roll<=100;++roll){int n=0;auto rng=[&](int,int){return ++n==1?1:roll;};int remaining=roll,expected=-1;for(auto c:pool){remaining-=c.weight;if(remaining<=0){expected=c.spell;break;}}assert(selectSorceress(s,rng)==expected);}
 // Resistance is checked after selection, special poison/age/acid skip racial/XP.
 s.heroResistance=100;draw=0;calls.clear();assert(selectSorceress(s,first,&rejection)==-1&&rejection==78&&calls.size()==3);
 s.heroResistance=0;s.artifact134=true;draw=0;assert(selectSorceress(s,first)==-1);
 s.alreadyActive[60]=s.alreadyActive[62]=s.alreadyActive[59]=true;draw=0;assert(selectSorceress(s,first)==75);
}`);execFileSync('c++',['-std=c++17','-fsanitize=undefined','-o',dir+'/test',dir+'/test.cpp']);execFileSync(dir+'/test');}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Forgetfulness61 preserves source count rounding, clock, first magnitude and old twelve primitives',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sorceress61-'));
 try{fs.writeFileSync(dir+'/test.cpp',`#include "${path.resolve('work/vcmi-wasm/lib/era/EraXpTimed184Rule.h')}"
#include <cassert>
#include <climits>
int main(){using namespace era_bridge::xp184;
 assert(supports(61)&&mass(61,3)&&!mass(61,2));
 for(int level=0;level<4;++level){auto s=cast({},61,3,level,0,0,false).state;assert(s.duration==3&&s.magnitude==level);auto r=cast(s,61,5,3,0,0,false);assert(!r.fresh&&r.state.duration==5&&r.state.mastery==3&&r.state.magnitude==level);assert(round(r.state,true,false).state.duration==4);assert(remove(r.state).state.duration==0);auto z=cast({},61,0,level,0,0,false).state;assert(!z.active()&&!remove(z).removed);auto n=cast({},61,-1,level,0,0,false).state;assert(n.active()&&!remove(n).removed&&round(n,true,false).state.duration==-1);}
 for(int count:{1,2,3,4,5,INT_MAX}){assert(forgetfulShootingCount(count,1,true)==(count/2<1?1:count/2));assert(forgetfulShootingCount(count,0,true)==count);assert(forgetfulShootingCount(count,-1,true)==count);assert(forgetfulShootingCount(count,1,false)==count);}
 // Existing twelve source spells keep their exact roles and counters.
 assert(cast({},59,0,2,0,0,false).state.duration==255);
 assert(cast({},42,0,3,0,0,false).counter==41);assert(cast({},54,0,3,0,0,false).counter==53);assert(cast({},60,0,3,0,0,false).counter==59);
 for(int id:{49,50,51,52})assert(!cast({},id,3,3,0,0,false).counter);
}`);execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-o',dir+'/test',dir+'/test.cpp']);execFileSync(dir+'/test');}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

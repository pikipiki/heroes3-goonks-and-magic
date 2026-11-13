/** Offline bounded source levels. No native/mod mutation or binary execution. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=path.resolve(process.argv[2]||'.');
const out=path.join(root,'outputs/wog-priorities-0.4.147/source-creature-levels');
fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const executable=path.resolve(root,'../era-project-eng/h3era.exe'),b=fs.readFileSync(executable);
assert.equal(sha(b),'451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181');
const pe=b.readUInt32LE(60),n=b.readUInt16LE(pe+6),opt=b.readUInt16LE(pe+20),base=b.readUInt32LE(pe+52);
function at(a,len){for(let i=0;i<n;i++){const p=pe+24+opt+40*i,v=base+b.readUInt32LE(p+12),s=b.readUInt32LE(p+16),r=b.readUInt32LE(p+20);if(a>=v&&a+len<=v+s)return b.subarray(r+a-v,r+a-v+len);}throw Error('Unmapped bounded PE address');}
assert.equal(at(0x6747b0,4).readUInt32LE(),0x6703b8);
const copies=[];for(let i=0;i<1000;i++){const e=at(0x78bf00+12*i,12),from=e.readUInt32LE(),to=e.readUInt32LE(4),length=e.readUInt32LE(8);if(!from)break;copies.push({from,to,length});}
assert(copies.length<1000);assert.deepEqual(copies[77],{from:0x787620,to:0x7d5088,length:47*0x74});
const levels=Array.from({length:197},(_,sourceId)=>{const address=sourceId<150?0x6703b8+sourceId*0x74+4:0x787620+(sourceId-150)*0x74+4;return{sourceId,level:at(address,4).readInt32LE(),evidence:{kind:sourceId<150?'SoD150':'WoG47Copy77',address:'0x'+address.toString(16)}};});
for(let id=150;id<197;id++){const p=0x7d0c90+id*0x74+4;assert(!copies.slice(78).some(c=>c.to<=p&&p<c.to+c.length));}
const dir=path.resolve(root,'../Third-Upgrade-Mod-Full/Data/Creatures'),cfg=[];
for(const name of fs.readdirSync(dir).filter(x=>/^\d+\.cfg$/.test(x)).sort((a,b)=>parseInt(a)-parseInt(b))){const bytes=fs.readFileSync(path.join(dir,name)),text=bytes.toString('latin1'),sourceId=parseInt(name),p=text.indexOf('Level=');
 // Match Amethyst ParseInt's FIRST strstr plus preceding-letter rejection.
 const valid=p>=0&&(p===0||!/[A-Za-z]/.test(text[p-1]));
 if(!valid)continue;
 const match=/^[ \t\r\n]*([+-]?\d+)/.exec(text.slice(p+6));assert(match,'Known CFG must have a defined atoi value');
 const level=Number(match[1]);assert(Number.isSafeInteger(level));
 cfg.push({sourceId,level,file:name,sha256:sha(bytes)});
 levels[sourceId]={sourceId,level,evidence:{kind:'AmethystFirstParseInt',file:name,sha256:sha(bytes)}};
}
assert.equal(levels.length,363);assert.equal(cfg.length,178);
for(let id=197;id<=362;id++)assert(levels[id]?.evidence.kind==='AmethystFirstParseInt','No guessed default for a new source actor');
const holes=levels.filter(x=>x.level<0).map(x=>x.sourceId);assert.deepEqual(holes,[122,124,126,128]);
assert(levels.every(x=>x.level>=-1&&x.level<=6));assert.equal(levels[132].level,6);
for(let id=174;id<=191;id++)assert.equal(levels[id].level,6);
const registryPath=path.join(root,'mod/tum-era/content/config/era-bridge-status-attacks.json'),registryBytes=fs.readFileSync(registryPath),bindings={...JSON.parse(registryBytes).sourceIds};
const commanderNames=['paladin','hierophant','templeGuardian','succubus','soulEater','brute','ogreLeader','shaman','astralSpirit'];
const commanderEvidence=commanderNames.map((name,i)=>{const file=path.join(root,'mod/wake-of-gods/Mods/commanders/content/config/commanders',name+'.json'),bytes=fs.readFileSync(file),data=JSON.parse(bytes),key=name+'1';assert(data[key]);assert(bytes.toString().includes('ZM'+(174+i)+'NPC.DEF'));bindings['wake-of-gods.commanders:'+key]=174+i;return{nativeKey:'wake-of-gods.commanders:'+key,sourceId:174+i,file:path.relative(root,file),sha256:sha(bytes)};});
for(const [key,id]of Object.entries(bindings)){assert(Number.isInteger(id)&&id>=0&&id<levels.length,'Unobserved source binding '+key);}
const selector=at(0x4e6358+45-13,1)[0];assert.equal(selector,2);assert.equal(at(0x4e633c+selector*4,4).readUInt32LE(),0x4e62a8);
const specialty=Array.from({length:8},(_,i)=>at(0x63eaa8+4*i,4).readInt32LE());assert.deepEqual(specialty,[3,3,2,2,1,1,0,4]);
assert.equal(at(0x4e62bd,7).toString('hex'),'8b048dc4ea6300');
const heroTable=at(0x679c80,4).readUInt32LE();assert.equal(heroTable,0x678420);
const heroSpecialists=[['core:olema',59,'inferno.json'],['core:mirlanda',120,'fortress.json']].map(([key,index,file])=>{
 const record=at(heroTable+index*40,40);assert.equal(record.readInt32LE(),3);assert.equal(record.readInt32LE(4),45);
 const nativeBytes=fs.readFileSync(path.join(root,'work/vcmi-wasm/config/heroes',file)),native=JSON.parse(nativeBytes)[key.slice(5)];assert.equal(native.index,index);assert.equal(native.specialty.bonuses.weakness.type,'SPECIAL_PECULIAR_ENCHANT');assert.equal(native.specialty.bonuses.weakness.addInfo,0);
 return{key,index,sourceRecordAddress:'0x'+(heroTable+index*40).toString(16),sourceKind:3,sourceSpell:45,nativeFile:file,nativeSha256:sha(nativeBytes)};
});
const report={schemaVersion:1,activation:false,nativeValidated:false,sourceExecutableSha256:sha(b),bounds:{SoD:[0,149],WoG:[150,196],newExplicitCfg:[197,362],cfgOverrides:cfg.length,disabledNegativeLevelIds:holes,observedCombatLevels:[0,1,2,3,4,5,6],unobservedSourceIds:'reject; never read beyond initialized tables'},sourceLevelExamples:{azure132:levels[132].level,commanders174to191:6},levels,bindings,bindingEvidence:{registrySha256:sha(registryBytes),commanders:commanderEvidence},weaknessSpecialty:{dispatch:'4E6358[45-13]=2 ->4E633C[2]=4E62A8',tableAddress:'0x63eaa8',values:specialty,entry7:'0x63eac4 is explicitly consumed by sibling branch4E62B9; defined adjacent DWORD4, not a guessed extension',reachableInitialLevels:'0..6;7 is an explicit bounded documented compatibility entry; no other out-of-range read',kind1:'5A0173..17B sets heroNULL, so no specialty in XP kind1'},astral263:{source:'4E62FD..4E6333 divides signed heroLevel by source zeroBasedLevel+1',azureExample:'hero7/raw100: source denominator7 ->103; old native Azure level10 ->100',unknownNativeKeys:'preserve native target level adaptation; never assign a source level to a Goonk'},limits:['Only supplied initial source, WoG initialization and TUM CFG corpus; external ERM MA:L mutations are outside this optional static binding','No runtime activation or native validation of proposed resolver']};
fs.writeFileSync(path.join(out,'source.json'),JSON.stringify(report,null,2)+'\n');
report.weaknessSpecialty.heroes=heroSpecialists;
fs.writeFileSync(path.join(out,'source.json'),JSON.stringify(report,null,2)+'\n');
for(const [file,start,end]of [['hero-specialty.asm',0x4e6260,0x4e6378],['kind1-hero.asm',0x5a0140,0x5a01b0]])fs.writeFileSync(path.join(out,file),execFileSync('/usr/bin/objdump',['-d','--start-address=0x'+start.toString(16),'--stop-address=0x'+end.toString(16),executable]));
const header=`/* Generated by review-source-creature-levels.mjs; source-only, OFF until scoped native validation. */\n#pragma once\n#include <array>\n#include <optional>\n#include <string_view>\nnamespace era_bridge {\ninline constexpr std::array<int,363> sourceInitialCreatureLevels{{${levels.map(x=>x.level).join(',')}}};\ninline std::optional<int> sourceInitialCreatureLevel(int id) {\n if(id<0||id>=int(sourceInitialCreatureLevels.size()))return std::nullopt;\n const int level=sourceInitialCreatureLevels[std::size_t(id)];\n return level<0?std::nullopt:std::optional<int>(level);\n}\nstruct SourceCreatureLevelBinding {std::string_view key;int sourceId;};\ninline constexpr std::array<SourceCreatureLevelBinding,${Object.keys(bindings).length}> sourceCreatureLevelBindings{{\n${Object.entries(bindings).sort(([a],[b])=>a.localeCompare(b)).map(([key,id])=>` {"${key}",${id}}`).join(',\n')}\n}};\ninline std::optional<int> sourceCreatureIdForLevel(std::string_view key) {\n for(const auto & binding:sourceCreatureLevelBindings)if(binding.key==key)return binding.sourceId;\n return std::nullopt;\n}\ninline std::optional<int> sourceCreatureLevelForKey(std::string_view key) {\n const auto id=sourceCreatureIdForLevel(key);return id?sourceInitialCreatureLevel(*id):std::nullopt;\n}\ninline std::optional<int> sourceSpecialty45Bonus(int zeroBasedLevel,int casterKind) {\n if(casterKind==1)return 0; // Direct XP kind1 has no hero pointer.\n constexpr std::array<int,8> values{{3,3,2,2,1,1,0,4}};\n if(zeroBasedLevel<0||zeroBasedLevel>=int(values.size()))return std::nullopt;\n return values[std::size_t(zeroBasedLevel)];\n}\n// Caller must reject a known-but-invalid source ID rather than use this fallback.\ninline std::optional<int> sourceSpecialtyTargetTier(std::string_view key,int nativeTier) {\n const auto id=sourceCreatureIdForLevel(key);\n if(id){const auto level=sourceInitialCreatureLevel(*id);return level?std::optional<int>(*level+1):std::nullopt;}\n return nativeTier>0?std::optional<int>(nativeTier):std::nullopt;\n}\n}\n`;
fs.writeFileSync(path.join(root,'scripts/era-bridge/creatures/native/EraSourceCreatureLevels.h'),header);
console.log(JSON.stringify({out,actors:levels.length,cfgOverrides:cfg.length,bindings:Object.keys(bindings).length,activation:false}));

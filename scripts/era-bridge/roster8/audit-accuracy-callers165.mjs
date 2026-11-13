/** Exhaustive local caller inventory: query != percentage lottery. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=process.argv[2]||'outputs/wog-priorities-0.4.147/eighth-evidence';
const root='work/vcmi-wasm/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected=new Map(Object.entries({
 'server/battles/BattleActionProcessor.cpp':[1,'integer','XP primary5A8950 mandatory1..100 draw'],
 'server/era/EraFaerieChainRuntime.h':[1,'integer','NormalChain19 next-victim5A6500 mandatory1..100 draw'],
 'server/era/EraConfluxExperience.h':[1,'integer','Independent XP source355 line primary1..100 draw'],
 'server/era/EraConfluxRuntime.h':[1,'float','Automatic355 canSpellBeCast eligibility only; no resistance draw'],
 'server/era/EraStatusAttacks.h':[1,'integer','Primary native source intrinsic status threshold, consumed by statusPrimaryAccepts'],
 'server/era/EraThunderAttackRuntime.h':[1,'integer','Intrinsic ATT_THUNDER5A8950 mandatory1..100 draw'],
 'server/era/EraDungeonChainTargets.h':[1,'integer','ChainShot4 source5A6582..65A5 mandatory1..100 draw'],
 'server/era/EraPrimordialCastRuntime.h':[1,'float','Optional direct AfterMelee canSpellBeCast eligibility; future actor admission absent'],
 'server/era/EraSulfideStatusRuntime.h':[1,'float','CFG CanCastSpellAtCoord5A3CD0 positive float only'],
 'server/era/EraCDispelRuntime.h':[1,'integer','Queued c78 target resistance mandatory1..100 draw'],
 'lib/spells/BattleSpellMechanics.cpp':[5,'mixed','Wall+Faerie primary eligibility float; source AoE, mass XP and ordinary native resistance loops stay integer']
}));
const hits=execFileSync('rg',['-n','statusRawAccuracy\\(',root,'-g','*.cpp','-g','*.h'],{encoding:'utf8'}).trim().split('\n');
const calls=[];
for(const hit of hits){
 const match=hit.match(/^(.*?):(\d+):(.*)$/);if(!match)throw Error('Unparsed caller');
 const file=match[1].slice(root.length),line=Number(match[2]),text=match[3].trim();
 if(file==='lib/era/EraSourceSpellAccuracy.h')continue;
 const spec=expected.get(file);if(!spec)throw Error('Unaudited new caller '+file);
 const type=spec[1]==='mixed'?(text.endsWith('true)>0;')?'float':'integer'):spec[1];
 if(type==='float'&&!/true\)\s*[><=]/.test(text))throw Error('Float query missing explicit opt-in '+file+':'+line);
 calls.push({path:root+file,line,semantics:type,explanation:spec[2],excerpt:text});
}
for(const[file,[count]]of expected)if(calls.filter(c=>c.path===root+file).length!==count)throw Error('Caller inventory changed '+file);
if(calls.filter(c=>c.semantics==='float').length!==5||calls.filter(c=>c.semantics==='integer').length!==10)throw Error('Unexpected float/integer partition');
fs.mkdirSync(out,{recursive:true});const binary='../era-project-eng/h3era.exe';
const asm=[['accuracy-wall-float165',0x59ffe0,0x5a0060],['accuracy-coord-float165',0x5a3cd0,0x5a3d48],['accuracy-faerie-float165',0x5a3f90,0x5a3fc8]].map(([name,start,stop])=>{
 const bytes=execFileSync('/usr/bin/objdump',['-D',`--start-address=${start}`,`--stop-address=${stop}`,binary]);
 const file=path.join(out,name+'.asm');fs.writeFileSync(file,bytes);return{path:file,sha256:sha(bytes),start,stop};
});
fs.writeFileSync(path.join(out,'accuracy-callers-source165.json'),JSON.stringify({
 status:'source-audit-future165-native-controls-pending',activeDataChanged:false,binarySHA:sha(fs.readFileSync(binary)),
 callerCount:15,floatEligibilityCount:5,integerLotteryCount:10,calls,
 files:[...expected.keys()].map(file=>({path:root+file,sha256:sha(fs.readFileSync(root+file))})),asm,
 conclusion:'Only source eligibility calls opt into positive float. No integer threshold, roll bound, RNG call count or ordinary native probability has been changed by this audit.',
 futureNativeTests:['CASES=positiveQueries165 POSITIVE_QUERY_CASE=wall CONFLUX_PRODUCTION=1','CASES=positiveQueries165 POSITIVE_QUERY_CASE=134 CONFLUX_PRODUCTION=1','CASES=positiveQueries165 POSITIVE_QUERY_CASE=356 CONFLUX_PRODUCTION=1'],
 fixtureNotes:'RealThorgrim39Expert +BattleDwarf40 +adjacentUnicorn20 produces about0.8%.356 must defend a real human garrison without hero, because its sourceCatalyst legitimately negates natural resistance when its caster-side hero exists.'
},null,2)+'\n');console.log('Audited15 callers:5float eligibility,10integer lotteries; native165 controls pending.');

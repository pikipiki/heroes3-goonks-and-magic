import test from 'node:test';import assert from 'node:assert/strict';
import {readArtifactTraits,parseJsonc,identifiersByIndex,decodeArtifactIcon,encodePng,scenarioIcon,importNativeArtifacts} from '../scripts/era-bridge/artifacts/importer.mjs';
const row=(name,cost,slot=15,rank='J')=>{const cols=Array(23).fill('');cols[0]=name;cols[1]=cost;cols[2+slot]='x';cols[21]=rank;cols[22]='"{text}';return cols.join('\t');};
test('traits preserve blank-cost rows, malformed multiline descriptions do not shift ids',()=>{
 const text=[row('One','100'),'badly quoted text "','not a descriptor',row('Combination','',18,'S'),'extra prose',row('Three','300',14)].join('\n');
 const r=readArtifactTraits(text,{validateSentinels:false});assert.equal(r.length,3);assert.equal(r[1].id,1);assert.equal(r[1].value,0);assert.deepEqual(r[1].slot,['HEAD']);assert.deepEqual(r[2].slot,['LEFT_HAND']);assert.throws(()=>readArtifactTraits(text),/sentinels/);
});
test('JSONC parser preserves quoted comment-looking strings and nested trailing commas',()=>{
 const r=parseJsonc('{"A":{"index":17,"literal":"//foo,}",},/* comment */"B":{"index":18},}');assert.equal(r.A.literal,'//foo,}');assert.equal(identifiersByIndex([r]).get(17),'A');assert.throws(()=>identifiersByIndex([r,r]),/Duplicate/);
});
function fakeDef(){const p=784+16+13+4,b=Buffer.alloc(p+32+44*44);b.writeUInt32LE(71,0);b.writeUInt32LE(44,4);b.writeUInt32LE(44,8);b.writeUInt32LE(1,12);b.writeUInt32LE(1,788);b.write('HrArt0.pcx',800);b.writeUInt32LE(p,813);b.writeUInt32LE(0,p+4);for(const at of [8,12,16,20])b.writeUInt32LE(44,p+at);b[16+2*3]=11;b[17+2*3]=9;b[18+2*3]=7;b.fill(2,p+32);return b;}
test('bounded DEF extraction keeps ordinary dark palette colors and valid source dimensions',()=>{
 const image=decodeArtifactIcon(fakeDef(),0);assert.deepEqual([...image.rgba.subarray(0,4)],[11,9,7,255]);assert.equal(image.width,44);assert.equal(image.height,44);
 const large=scenarioIcon(image);assert.equal(large.width,58);assert.equal(large.height,64);assert.deepEqual([...large.rgba.subarray((10*58+7)*4,(10*58+7)*4+4)],[11,9,7,255]);const png=encodePng(image);assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.throws(()=>decodeArtifactIcon(fakeDef().subarray(0,790),0),/Truncated/);
});
test('a missing source DEF/MSK excludes entire artifact with zero partially emitted files',()=>{
 const defs=fakeDef();defs.write('HrArt0.pcx',800);const archive={extract:name=>{if(name==='artifact.def')return defs;throw new Error('missing map');}};
 const traits=[{id:0,class:'MINOR',value:100,slot:['HEAD'],source:'source:3'}],language={0:{name:'Original',description:'Original desc',event:'Original pickup'}};
 const result=importNativeArtifacts({traits,language,cfgs:{0:'Attack=3'},archive});assert.deepEqual(result.definitions,{});assert.equal(result.files.size,0);assert.equal(result.report[0].included,false);assert.match(result.report[0].reason,/missing map/);
});
import {normalizeArtifactLanguage} from '../scripts/era-bridge/artifacts/importer.mjs';
import {validateSchema,validateNativeLinks} from '../scripts/era-bridge/artifacts/validate-native.mjs';
test('legacy event TSV suffix is removed without touching narrative quotation marks',()=>{
 const a=normalizeArtifactLanguage({name:'Original',description:'Desc'},{name:'Original',description:'Desc',event:'He says "Keep it", and leaves."\\t'});assert.equal(a.text.event,'He says "Keep it", and leaves.');assert.equal(a.repairs.length,1);
 const b=normalizeArtifactLanguage({name:'Original',description:'Desc'},{name:'Original',description:'Desc',event:'He says "Keep it"'});assert.equal(b.text.event,'He says "Keep it"');assert.equal(b.repairs.length,0);
 const c=normalizeArtifactLanguage({name:'Original',description:'Desc'},{name:'Original',description:'Desc',event:'"Quoted field"\t'});assert.equal(c.text.event,'Quoted field');
});
test('description closing quote is removed only with independent source-wrapper evidence',()=>{
 const t=readArtifactTraits(row('Artifact','100')+'\nHe says "Keep it"."',{validateSentinels:false})[0];assert.equal(t.quotedDescription,true);assert.equal(t.description,'{text}\nHe says "Keep it".');
 const a=normalizeArtifactLanguage(t,{description:t.description+'"'});assert.equal(a.text.description,t.description);assert.equal(a.repairs.length,1);
 const b=normalizeArtifactLanguage(t,{description:'Other text ends in "speech"'});assert.equal(b.text.description,'Other text ends in "speech"');assert.equal(b.repairs.length,0);
 const c=normalizeArtifactLanguage({name:'No quote evidence',description:'Desc',quotedDescription:false},{description:'Desc"'});assert.equal(c.text.description,'Desc"');
});
test('schema/link checks catch malformed bonus subtype, namespace, combination and missing assets',()=>{
 assert(validateSchema({type:'CREATURE_DAMAGE',subtype:1},{type:'object',properties:{subtype:{type:'string'}}}).length>0);
 const defs={x:{bonuses:{a:{type:'SPELL',subtype:'core:bless'}},components:['core:sword'],graphics:{image:'icon.png',scenarioBonus:'big.png',map:'map.def'}}};const env={spellIds:['bless'],artifactIds:['sword'],assetExists:()=>true};assert.deepEqual(validateNativeLinks(defs,env),[]);
 const bad=structuredClone(defs);bad.x.bonuses.a.subtype='other:bless';bad.x.components=['core:typo'];assert.equal(validateNativeLinks(bad,env).length,2);assert.equal(validateNativeLinks(defs,{...env,assetExists:()=>false}).length,4);
});
test('unavailable mandatory source data fails before producing apparent successful empty imports',()=>{
 assert.throws(()=>importNativeArtifacts({traits:null,language:{},cfgs:{},archive:{extract:()=>null}}),/Complete source/);
 assert.throws(()=>importNativeArtifacts({traits:[],language:{},cfgs:{},archive:{extract:()=>null}}),/artifact.def is unavailable/);
});

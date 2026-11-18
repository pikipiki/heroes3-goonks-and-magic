// Standalone candidate: node test-math.cjs [optional path to current EraHenchmanRules.h]
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const golden=require('./golden-vectors.json');
const provenance=require('./provenance.json');
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
for(const [file,expected] of Object.entries(provenance.sha256))assert.equal(sha(path.join(__dirname,file)),expected,`Artifact changed: ${file}`);
if(process.argv[2])assert.equal(sha(process.argv[2]),provenance.actualHeaderSha256,'Rebuild probe and review golden data after changing the helper header');
(async()=>{
 const wasm=await require('./wasm-model.js')();
 let checks=0;
 for(const row of golden.roots){
  assert.equal(row.eraResultBits.cw037f,row.eraResultBits.cw027f);
  assert.equal(wasm._sqrt_bits(row.inputSingleBits)>>>0,row.eraResultBits.cw037f,`sqrt bits gain=${row.gain}`);
  assert.equal(wasm._hero_root(row.gain),row.truncated,`root consumed gain=${row.gain}`); checks+=3;
 }
 for(const row of golden.costBases){
  assert.equal(row.eraResultBits.cw037f,row.eraResultBits.cw027f);
  assert.equal(wasm._model_pow_three_fifths_bits(row.inputSingleBits)>>>0,row.eraResultBits.cw037f,`pow expression bits cost=${row.costBase}`);
  assert.equal(wasm._level_rate(0,row.costBase),row.levelRateWithFightZero,`level consumed cost=${row.costBase}`); checks+=3;
 }
 for(const row of golden.selectors){assert.equal(wasm._level_rate(row.fight,row.ai),row.levelRate,`selector fight=${row.fight} ai=${row.ai}`);checks++;}
 console.log(JSON.stringify({checks,rootVectors:golden.roots.length,costBaseVectors:golden.costBases.length,selectorVectors:golden.selectors.length,status:'passed'}));
})().catch(error=>{console.error(error);process.exitCode=1;});

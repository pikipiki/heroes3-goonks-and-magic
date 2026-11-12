/** Prepare uninstalled source resistance89 resources; actor contracts remain gated. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive}from'../resources.mjs';import{readEraSoundArchive}from'../objects/sound-assets.mjs';
const[source,out]=process.argv.slice(2);if(!source||!out)throw Error('Usage: prepare-inferno-resistance-assets.mjs TUM FRESH_OUTPUT');if(fs.existsSync(out))throw Error('Output must be fresh');
const animation=readEraArchive(fs.readFileSync(path.join(source,'Data/AmeEfect.pac'))),sound=readEraSoundArchive(fs.readFileSync(path.join(source,'Data/AmeEfect.snd'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const entries=[['content/Sprites/tum-era/inferno-resistance/shotres.def',animation.extract('shotres.def')],['content/Sounds/tum-era/inferno-resistance/shotres.wav',sound.extract('shotres.wav')]];
const metadata={active:false,complete:false,actors:[337,338],sourceEffect:89,sourceMapping:'more_anims.era table10017850 index85=ZMGC01.def; index89at10017880=shotres.def pointer100156A4',animationArchiveSha256:animation.sha256,soundArchiveSha256:sound.sha256,files:{}};
for(const[name,bytes]of entries){const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);metadata.files[name]={sha256:sha(bytes),bytes:bytes.length};}
fs.mkdirSync(path.join(out,'content/config'),{recursive:true});fs.writeFileSync(path.join(out,'content/config/inferno-resistance-graphics.candidate.json'),JSON.stringify({ac_mapping:[{id:89,defnames:['tum-era/inferno-resistance/shotres.def']}]},null,2));fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(metadata,null,2));console.log(JSON.stringify({output:path.resolve(out),active:false,resources:2}));

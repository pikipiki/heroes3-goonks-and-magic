/** Independent source/binary evidence: do not invent a naval bonus for354. */
import fs from'node:fs';import crypto from'node:crypto';import path from'node:path';
import{readEraArchive}from'../resources.mjs';
const [project='.',source='../Third-Upgrade-Mod-Full',plugins='../h3era-plugins',era='../era-project-eng',output='outputs/wog-priorities-0.4.147/source354-mimic71-consumer.json']=process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),text=p=>read(p).toString('utf8');
const comboPath=path.join(plugins,'Emerald3/emerald/ArtifactCombos.cpp'),duplicatePath=path.join(plugins,'Emerald3/emerald/duplicate.cpp'),mainPath=path.join(source,'Data/s/Third Upgrade Mod.erm');
const combos=text(comboPath),duplicate=text(duplicatePath),main=text(mainPath);
if(!/int Arts\[10\] = \{ 71, 123\};\s*BuildUpCombo\(136, 7, 2, Arts\);/.test(combos))throw Error('Changed original naval combination');
if(/!!UN:A7\//.test(main))throw Error('New source overrides combination7');
const executable=read(path.join(era,'h3era.exe')),pe=executable.readUInt32LE(60),sectionCount=executable.readUInt16LE(pe+6),optionalSize=executable.readUInt16LE(pe+20),base=executable.readUInt32LE(pe+52);
const bytesAt=(address,length)=>{for(let i=0;i<sectionCount;i++){const off=pe+24+optionalSize+i*40,va=base+executable.readUInt32LE(off+12),size=executable.readUInt32LE(off+16),raw=executable.readUInt32LE(off+20);if(address>=va&&address+length<=va+size)return executable.subarray(raw+address-va,raw+address-va+length);}throw Error('Unmapped original code');};
if(bytesAt(0x4e4d80,3).toString('hex')!=='833947')throw Error('Original71 slot comparison changed');
const pac=readEraArchive(read(path.join(source,'Data/EmeraldArtifacts.pac'))),baseGame=readEraArchive(read(path.join(project,'work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')));
const movement=baseGame.extract('movement.txt').toString('latin1');if(!/Necklace of Ocean Guidance\t1000/.test(movement))throw Error('Changed source naval amount');
const result={sourceCreature:354,sourceProperty:{CreatureMimicArtifact:71},originalArtifact:71,originalArtifactName:'Necklace of Ocean Guidance',originalNumericalBonus:1000,
 conclusion:{navalMovementFromThisMimic:false,reason:'Original sea-movement function scans19 physical equipped slots for71. Its only HasArtifact fallback checks the parent combination136, not71. Creature2Artifact returns71 without remapping; NewHasArtifact boolean emulation does not intercept the physical-slot scan.',scope:'Supplied source, native original executable and no active compensating external callback; this is a dormant source effect, not authorization to add1000.',otherHasArtifactQueries:'Generic HasArtifact/ERM A2 lookup emulation is a separate contract; absence of naval movement does not waive such consumers.'},
 originalAddresses:{seaMovementEntry:'004E4C00(arg1)',navigationBranch:'004E4C24..004E4E21',physicalSlot71Loop:'004E4D75..004E4D8C',parentComboLoad:'004E4D8E..004E4DAA',parentHasArtifactCall:'004E4DAE',singleNavalAddition:'004E4DB7..004E4DC2',navalQuantityInitialization:'004D7664..004D7676 from MOVEMENT.TXT'},
 combination:{index:7,artifact:136,parts:[71,123],source:'ArtifactCombos.cpp227..229; BuildUpCombo writes component.combonum=7; TUM only replaces combination13..22'},
 hooks:{newHasArtifact:'duplicate.cpp482..601 returns1 on first original-army mimic, before checking later carriers; never returns a multiplicity',disabledVirtualEquipment:'handleCreatureAsArt and negativeArtSlots are commented out; installation references dllmain1046..1047 commented out',navalComboStride:'ArtifactCombos.cpp700..703 only changes element stride and resumes004E4DAA; does not change requested artifact to71'},
 sourcePins:{artifactArchive:pac.sha256,executable:sha(executable),emeraldPlugin:sha(read(path.join(source,'EraPlugins/emerald3_3.era'))),combos:sha(read(comboPath)),duplicate:sha(read(duplicatePath)),mainScript:sha(read(mainPath)),movementText:sha(Buffer.from(movement,'latin1'))},
 boundedOriginalCode:{address:'004E4D75',length:80,sha256:sha(bytesAt(0x4e4d75,80))}};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log('Recorded dormant354 naval-mimic consumer evidence; no active data or engine changed.');

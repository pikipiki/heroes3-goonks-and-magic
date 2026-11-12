/** Original267 assets and actual equipped-army immunity list; inactive review. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive}from'../resources.mjs';
import{readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon}from'./importer.mjs';
import{compileSilenceCape,SILENCE_CAPE_SOURCE_IDS}from'./silence-cape.mjs';
import{identifiersByIndex,parseJsonc}from'./importer.mjs';
import{readSpellCatalogue}from'./spell-catalogue.mjs';

const[project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('PROJECT SOURCE FRESH_OUTPUT required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Changed original script');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed original artifact archive');
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const write=(name,data)=>{const p=path.join(output,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');},definitions={};
const spells=identifiersByIndex(fs.readdirSync(path.join(project,'work/vcmi-wasm/config/spells')).filter(f=>f.endsWith('.json')).map(f=>parseJsonc(fs.readFileSync(path.join(project,'work/vcmi-wasm/config/spells',f),'utf8'))));
const base=readEraArchive(fs.readFileSync(path.join(project,'work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod'))),spellTable=base.extract('sptraits.txt'),catalogue=readSpellCatalogue(spellTable.toString('latin1'));
for(const id of[267]){
 const cfg=fs.readFileSync(path.join(source,'Data/artifacts/267.cfg'),'utf8');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileSilenceCape({text:cfg,resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):undefined,baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));compiled.definition.text.description='{Cape of Silence}\n\nProtects the wearer’s army against Ice Bolt, Lightning Bolt, Implosion, Death Ripple, Fire Wall, Shield, Protection from Fire or Water, Magic Mirror, Cure, Bless, Curse, Bloodlust, Weakness, Stone Skin, Disrupting Ray, Fortune, Haste, Slow and Blind. Also prevents the listed beneficial spells.';definitions['artifact'+id]=compiled.definition;
 for(const suffix of['def','msk'])write('content/Sprites/'+asset+'/map.'+suffix,archive.extract('ava'+String(id).padStart(4,'0')+'.'+suffix));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/silence-cape.candidate.json',definitions);
const pins={};for(const relative of['config.cpp','resistance.cpp','emerald.cpp'])pins[relative]=sha(fs.readFileSync(path.resolve(source,'../h3era-plugins/Emerald3/emerald',relative)));
write('source-review.json',{ids:[267],scriptSHA256:sha(script),archiveSHA256:archive.sha256,spellTableSHA256:sha(spellTable),emeraldSourcePins:pins,sourceEntries:SILENCE_CAPE_SOURCE_IDS,uniqueSpells:catalogue.filter(s=>SILENCE_CAPE_SOURCE_IDS.includes(s.id)),unprotectedLowLevelCombatSpells:catalogue.filter(s=>s.id>=10&&s.level<=2&&!SILENCE_CAPE_SOURCE_IDS.includes(s.id)),mechanism:'Emerald config.cpp323..325 populates a per-artifact spell table. resistance.cpp127..141 subtracts one from final reception probability for each equipped body slot of the victim hero. No bilateral spell-level cap exists in the provided source.',scope:'Native source creature/artifact reception exceptions remain separate. Terrain-only spells in the list do not invent a global casting prohibition.',descriptionCorrection:'Original prose promises neither side can cast levels1/2. Actual CFG protects only the wearer army against22 unique spells, including levels5 Implosion and MagicMirror, and omits four low-level combat spells. UI describes actual verified behavior.',pending:['Native wearer/adversary controls','Native beneficial/harmful/level5/omitted low-level spell controls','Backpack controls'],activationReady:false});
console.log('Prepared source267 exact immunity candidate; production unchanged.');

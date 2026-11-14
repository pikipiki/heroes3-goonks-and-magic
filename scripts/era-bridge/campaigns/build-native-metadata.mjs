/** Recover physical-to-active campaign dependencies from original H3C headers.
 * The runtime repair matches the entire converted header before applying. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {readLegacyCampaign,mapLegacyPrerequisites,extractLegacySources} from './legacy-importer.mjs';
import {readOriginalCampaign,sha256} from './importer.mjs';
export const metadataFile='mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/metadata.json';
export function buildNativeMetadata(){
 const rules=[],inventory=[];
 for(const name of ['zc1','zc2','zc3','zc4']){
  const original=readLegacyCampaign(`tests/fixtures/wog-campaigns/original358f/${name}.h3c`),converted=readOriginalCampaign(`mod/wake-of-gods/Mods/maps/content/maps/${name}.vcmp`),mapped=mapLegacyPrerequisites(original,converted.header);
  const patches=mapped.filter(s=>JSON.stringify(s.requires)!==JSON.stringify(converted.header.scenarios[s.index].preconditions||[])).map(s=>({index:s.index,map:s.map,originalRequires:converted.header.scenarios[s.index].preconditions||[],requires:s.requires}));
  const sources=original.maps.map(m=>({map:m.map,mapSha256:m.sha256,sources:extractLegacySources(m.bytes).map(s=>({sha256:s.sha256,offset:s.offset,length:s.length,firstOccurrence:s.firstOccurrence}))}));
  inventory.push({id:name,originalSha256:original.sha256,headerSha256:original.headerSha256,convertedSha256:converted.sha256,physicalRegions:original.header.scenarios.map(s=>({index:s.physicalIndex,map:s.map,requires:s.requires})),activeRegions:mapped,patches,sources});
  if(patches.length)rules.push({id:name,originalSha256:original.sha256,convertedSha256:converted.sha256,expectedHeaderSha256:sha256(Buffer.from(JSON.stringify(converted.header))),expectedHeader:converted.header,patches});
 }
 return{config:{schemaVersion:1,contract:'source-campaign-metadata-v1',enabled:true,rules},inventory:{schemaVersion:1,originalPackage:{url:'https://www.vault.acidcave.net/download.php?id=22',sha256:'8f210d789c8c3f799549bc67a5d48ee346036ded726c298ddfb95301e3cfc41a'},campaigns:inventory,originalCampaignsEnabled:false}};
}
export function writeNativeMetadata(){const {config,inventory}=buildNativeMetadata();for(const [file,data]of[[metadataFile,config],['outputs/wog-priorities-0.4.147/campaign-runtime/original-metadata.json',inventory]]){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))writeNativeMetadata();

import fs from 'node:fs';
import path from 'node:path';
import {inventoryErm, bindEvents, sha256} from './erm-inventory.mjs';
import {readJsonc, createProductionObjectResolvers} from '../objects/production-resolvers.mjs';
import {readEraArchive, readCreatureTable} from '../resources.mjs';
import {parseCreatureExperience} from '../creatures/crexpbon.mjs';
import {parseReplacementScript, parseDwellingTable} from '../objects/objects.mjs';
import {validateOriginalRetaliationShield} from '../artifacts/original-retaliation157.mjs';

const evidenceRoot = 'outputs/wog-priorities-0.4.147';
const xpRoot = evidenceRoot + '/source-xp-complete166';
const sorted = values => [...values].sort((a,b) => a.localeCompare(b,'en'));
const countBy = (rows, field) => Object.fromEntries(sorted(new Set(rows.map(r=>r[field])))
  .map(key=>[key,rows.filter(r=>r[field]===key).length]));
const walk = root => sorted(fs.readdirSync(root,{withFileTypes:true}).flatMap(entry =>
  entry.isDirectory()?walk(path.join(root,entry.name)):[path.join(root,entry.name)]));

export function buildCompatibilityInventory({projectRoot, sourceRoot, bindings}) {
  const json = relative => readJsonc(path.join(projectRoot,relative));
  const reference = relative => {
    if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw Error('Unsafe reference '+relative);
    const file = path.join(projectRoot,relative);
    if (!fs.statSync(file).isFile()) throw Error('Missing reference '+relative);
    return {file:relative, sha256:sha256(fs.readFileSync(file))};
  };
  const sourceFiles = new Map();
  const sourceBytes = relative => {
    const bytes = fs.readFileSync(path.join(sourceRoot,relative));
    sourceFiles.set(relative,{file:relative,sha256:sha256(bytes),bytes:bytes.length});
    return bytes;
  };
  const sourceJson = relative => JSON.parse(sourceBytes(relative));
  const globalConfigRules=[];
  const globalConfigs=walk(path.join(sourceRoot,'Data')).filter(file=>/\.(cfg|ini)$/i.test(file)
    &&!/^Data\/(Creatures|artifacts)\//.test(path.relative(sourceRoot,file))).map(file=>{
      const relative=path.relative(sourceRoot,file),bytes=sourceBytes(relative);
      for(const[index,line]of bytes.toString('utf8').split(/\r?\n/).entries()){
        if(!line.trim()||/^(;|#|\/\/|\[)/.test(line.trim()))continue;
        globalConfigRules.push({id:`global:${relative}:${index+1}`,source:{file:relative,line:index+1},
          declaration:line,status:'unassessed',scope:relative.includes('MapEdPatch')?'editor':'gameplay'});
      }
      return{file:relative,sha256:sha256(bytes),status:'unassessed'};
    });
  const plugins=fs.existsSync(path.join(sourceRoot,'EraPlugins'))?
    walk(path.join(sourceRoot,'EraPlugins')).filter(file=>/\.(dll|era)$/i.test(file)).map(file=>{
      const relative=path.relative(sourceRoot,file),bytes=sourceBytes(relative);
      return{file:relative,sha256:sha256(bytes),bytes:bytes.length,status:'platform-parity-unassessed',
        gap:'Native behavior adapters may cover parts of this plugin; Windows binary execution is unsupported.'};
    }):[];
  const manifest = json('mod/tum-era/mod.json');
  const scripts = sorted(fs.readdirSync(path.join(sourceRoot,'Data/s')).filter(f=>/\.erm$/i.test(f)))
    .map(file => inventoryErm(sourceBytes('Data/s/'+file),'Data/s/'+file));
  if (scripts.some(s=>s.diagnostics.length)) throw Error('Unparsed ERM: '+JSON.stringify(scripts.flatMap(s=>s.diagnostics)));
  const events = bindEvents(scripts.flatMap(s=>s.events),bindings.events,reference);
  const replacers = [];
  for (const script of scripts.filter(s=>/replacer/i.test(s.file))) {
    const candidateEvents = events.filter(e=>e.source.file===script.file);
    try {
      const plan = parseReplacementScript(sourceBytes(script.file).toString('utf8'),{source:script.file});
      replacers.push({file:script.file,sourceId:plan.id,targetType:plan.targetType,targetSubtype:plan.targetSubtype,
        enabledInSource:plan.enabled,conditions:plan.conditions,rules:plan.rules,status:'offline-adapter-only',
        implementation:[reference('scripts/era-bridge/objects/objects.mjs')],
        tests:[reference('tests/era-bridge-objects.test.mjs')],
        gap:'No production first-day replacement hook is asserted by the offline interpreter.'});
      for (const event of candidateEvents) {
        event.relatedReplacer=plan.id;
        // A parsed day-one program is not evidence for its initialization blocks.
        if (event.source.trigger.startsWith('!?FU(OnEveryDay)') && event.status==='unassessed')
          event.status='offline-adapter-only';
      }
    } catch (error) {
      replacers.push({file:script.file,status:'unassessed',diagnostic:error.code??error.message,
        gap:'This source program was not accepted by the strict replacement adapter.'});
    }
  }
  const archiveBytes = sourceBytes('Data/AmeCre.pac');
  const archive = readEraArchive(archiveBytes);
  const tableBytes = archive.extract('Crtraits.txt'), xpBytes = archive.extract('crexpbon.txt');
  const resolver = createProductionObjectResolvers({projectRoot,sourceRoot});
  const creatureRules = [], creatureConfigs = [];
  for (const file of sorted(fs.readdirSync(path.join(sourceRoot,'Data/Creatures')).filter(f=>/\.cfg$/i.test(f)))) {
    const relative='Data/Creatures/'+file, bytes=sourceBytes(relative);
    const sourceId=/^\d+\.cfg$/.test(file)?Number(file.slice(0,-4)):null;
    const nativeId=sourceId===null?null:resolver.resolveCreature(sourceId)??null;
    const rules=[];
    for(const [index,line] of bytes.toString('utf8').split(/\r?\n/).entries()) {
      const statement=line.trim();if(!statement||/^(;|#|\/\/)/.test(statement))continue;
      const m=statement.match(/^([^=]+)=(.*)$/);
      const row={id:`cfg:${file}:${index+1}`,source:{file:relative,line:index+1,sha256:sha256(line)},
        sourceId,nativeId,key:m?.[1].trim()??null,value:m?.[2].trim()??statement,
        status:'unassessed',evidence:[],gap:'A resolved creature identity does not validate this individual CFG property.'};
      rules.push(row.id);creatureRules.push(row);
    }
    creatureConfigs.push({file:relative,sourceId,nativeId,status:nativeId?'identity-resolved':'identity-unresolved',rules});
  }
  const creatures=readCreatureTable(tableBytes.toString('latin1')).map((definition,sourceId)=>({
    sourceId,name:definition.name,nativeId:resolver.resolveCreature(sourceId)??null,
    sourceSha256:sha256(JSON.stringify(definition)),sourceDefinition:definition,status:'runtime-parity-unassessed',
    gap:'Base stats, flags, intrinsic bonuses and source defaults require semantic comparison.'}));
  const policyFile='mod/tum-era/content/config/era-bridge-source-xp-admission-v1.json';
  const policy=json(policyFile),contracts=json(xpRoot+'/contracts.json');
  const activation=json(xpRoot+'/activation.json');
  if(policy.archiveSha256!==sha256(archiveBytes))throw Error('Changed admitted source archive');
  if(activation.contractsSha256!==sha256(JSON.stringify(contracts)))throw Error('Changed XP contracts');
  if(activation.policySha256!==reference(policyFile).sha256)throw Error('Changed XP activation');
  const xpRules=parseCreatureExperience(xpBytes.toString('latin1')).map(row=>{
    const nativeId=resolver.resolveCreature(row.creature)??null;
    const selected=policy.rows.find(p=>p.sourceLine===row.line&&p.sourceId===row.creature&&p.code===row.code&&'#'+p.spell===row.modifier);
    const key=`${row.creature}:${row.code}:${row.modifier.replace('#','')}`;
    const proof=contracts.rows.find(r=>r.key===key);
    const validated=Boolean(selected&&proof?.passed&&contracts.nativeValidated&&policy.enabled&&policy.nativeValidated
      &&JSON.stringify(selected.chances)===JSON.stringify(row.values));
    return {id:`xp:${row.line}`,source:{file:'Data/AmeCre.pac::crexpbon.txt',line:row.line},
      sourceId:row.creature,nativeId,code:row.code,modifier:row.modifier,values:row.values,
      status:validated?'validated-source-contract':'unassessed',
      ...(validated?{executionOwner:selected.executionOwner,evidence:[reference(policyFile),reference(xpRoot+'/contracts.json')],
        rowEvidenceSha256:proof.evidenceSha256,implementation:[reference('work/vcmi-wasm/server/era/EraSourceExperienceRuntime.h')]}:
        {evidence:[],gap:'Not included in the43-row spell admission; may already be provided by existing XP/default adapters.'})};
  });
  if(xpRules.filter(r=>r.status==='validated-source-contract').length!==43)throw Error('Incomplete43-row XP proof mapping');
  const activeArtifacts = new Map();
  for(const config of manifest.artifacts)for(const[key,value]of Object.entries(json('mod/tum-era/content/'+config)))
    if(/^artifact\d+$/.test(key))activeArtifacts.set(Number(key.slice(8)),{nativeId:'tum-era:'+key,definition:reference('mod/tum-era/content/'+config),name:value.text?.name});
  validateOriginalRetaliationShield(json('mod/tum-era/content/config/era-original-retaliation-shield.json'));
  const shieldFile='mod/wake-of-gods/Mods/artifacts/content/config/artifacts/crimsonShieldOfRetribution.json';
  const shield=json(shieldFile).crimsonShieldOfRetribution;
  if(shield?.bonuses?.defence?.val===2&&!Object.values(shield.bonuses).some(b=>b.type==='CREATURE_DAMAGE'))
    activeArtifacts.set(157,{nativeId:'wake-of-gods.artifacts:crimsonShieldOfRetribution',definition:reference(shieldFile)});
  const artifactNames=sourceJson('Lang/TUM_Artifacts.json').era.artifacts;
  const artifactIds=sorted(new Set([...Object.keys(artifactNames).map(Number).filter(n=>n>=171&&n<=279),157].map(String))).map(Number);
  const artifactRules=[];
  const artifacts=artifactIds.map(sourceId=>{
    const file=`Data/artifacts/${sourceId}.cfg`, exists=fs.existsSync(path.join(sourceRoot,file));
    if(exists)for(const[index,line]of sourceBytes(file).toString('utf8').split(/\r?\n/).entries()){
      if(!line.trim()||/^(;|#|\/\/)/.test(line.trim()))continue;
      artifactRules.push({id:`artifact-cfg:${sourceId}:${index+1}`,sourceId,source:{file,line:index+1},
        declaration:line,status:'unassessed',gap:'Active artifact availability is distinct from per-property source parity.'});
    }
    return {sourceId,name:artifactNames[sourceId]?.name??null,active:activeArtifacts.has(sourceId),
      ...(activeArtifacts.get(sourceId)??{}),sourceCfg:exists?file:null,status:'availability-only',
      relatedBindings:bindings.events.filter(b=>b.artifacts?.includes(sourceId)).map(b=>b.id)};
  });
  // Include even source CFGs outside the language catalogue, without silently dropping them.
  const uncataloguedArtifactConfigs=sorted(fs.readdirSync(path.join(sourceRoot,'Data/artifacts')).filter(f=>/\.cfg$/i.test(f)))
    .filter(f=>!artifactIds.includes(Number(f.slice(0,-4)))).map(file=>{
      const relative='Data/artifacts/'+file;sourceBytes(relative);return{file:relative,status:'uncatalogued-source-config'};
    });
  const objectDefinitions=[];
  for(const config of manifest.objects??[])for(const[group,data]of Object.entries(json('mod/tum-era/content/'+config)))
    for(const[key,definition]of Object.entries(data.types??{}))objectDefinitions.push({group,key,name:definition.name??null,
      definition:reference('mod/tum-era/content/'+config),definitionSha256:sha256(JSON.stringify(definition))});
  const bankSource=sourceJson('Lang/TUM_CreatureBanks.json').RMG.objectGeneration['16'];
  const banks=Object.entries(bankSource).map(([id,definition])=>({sourceId:Number(id),name:definition.name??null,
    source:{file:'Lang/TUM_CreatureBanks.json',pointer:'/RMG/objectGeneration/16/'+id,sha256:sha256(JSON.stringify(definition))},
    nativeDefinitions:objectDefinitions.filter(o=>o.key==='eraBank'+id),status:'parity-unassessed',
    implementation:[reference('scripts/era-bridge/banks.mjs')],tests:[reference('tests/era-bridge-banks.test.mjs')],
    gap:'Four reward states, guard placement, sounds, RMG and scripted behavior need exact per-object evidence bindings.'}));
  const dwBytes=archive.extract('DwTable.txt');
  const dwellings=parseDwellingTable(dwBytes.toString('latin1')).map(row=>({
    ...row,id:`dwelling:${row.objectType}:${row.objectSubtype}`,status:'parity-unassessed',
    resolvedCreatures:row.creatureIds.map(id=>({sourceId:id,nativeId:resolver.resolveCreature(id)??null})),
    nativeDefinitions:objectDefinitions.filter(o=>o.key===`eraDwelling${row.objectType}_${row.objectSubtype}`),
    gap:'Recruit identity, guards, weekly growth and scripted replacement require per-object evidence.'}));
  // The existing parser preserves both source columns and their numeric subtypes.
  const dwellingSource=bindings.dwellingParser; // checked-in implementation reference, not an activation flag
  const sourceModules=sorted(walk(path.join(projectRoot,'mod/wake-of-gods')).filter(f=>path.basename(f)==='mod.json'))
    .map(file=>{const relative=path.relative(projectRoot,file),value=readJsonc(file);return{
      file:relative,name:value.name,version:value.version??null,keepDisabled:value.keepDisabled===true,
      status:value.keepDisabled?'disabled-by-default':'availability-only',definition:reference(relative),
      gap:'Default availability does not prove equivalence to the original WoG scripts.'};});
  const actorContractsFile=evidenceRoot+'/eighth-reviewed-actor-contracts.json';
  const actorContracts=json(actorContractsFile).actorContracts;
  for(const config of creatureConfigs){
    const proof=actorContracts[config.sourceId];
    if(proof?.nativeValidated&&proof.complete&&proof.nativeId===config.nativeId){
      const source=sourceFiles.get(config.file);
      if(source.sha256!==proof.sourceCfgSha256)throw Error('Stale actor CFG proof '+config.file);
      config.historicalWholeActorContract={scope:proof.sourceScope,evidence:reference(actorContractsFile),
        nativeEvidence:proof.nativeEvidence.map(f=>reference(evidenceRoot+'/'+f))};
      // Retain property-level uncertainty rather than spreading an actor's broad claim.
    }
  }
  const scriptsSummary=scripts.map(script=>({file:script.file,sha256:sourceFiles.get(script.file).sha256,
    triggers:script.triggerCount,postTriggers:script.postTriggerCount,events:script.events.length,statusCounts:countBy(events.filter(e=>e.source.file===script.file),'status')}));
  const limitations=[
    'Reference source is the supplied TUM3.5 tree plus the installed VCMI WoG port. No complete original WoG/ERA script-pack source has been supplied to this inventory.',
    'Unassessed means no exact semantic proof binding in this inventory; it does not mean absent, broken or disabled.',
    'File/test presence and entity activation do not count as native validation. Historical evidence retains its original scope and engine.',
    'Native adapters can replace ERM behavior without interpreting the original instruction stream. No Windows pointer or DLL execution is claimed.',
    'No whole-product completion percentage is computed from heterogeneous row counts.',
    'No game definitions, saves, settings or runtime interfaces are changed by this inventory.'
  ];
  return {schemaVersion:1,reference:{label:'TUM3.5 supplied source + installed VCMI WoG',release:json('package.json').version,
      tumMetadata:sourceJson('mod.json'),wogPortVersion:json('mod/wake-of-gods/mod.json').version,
      archiveSha256:sha256(archiveBytes),entries:{'Crtraits.txt':sha256(tableBytes),'crexpbon.txt':sha256(xpBytes),'DwTable.txt':sha256(dwBytes)},
      evidence:[reference('outputs/wog-priorities-0.4.147/checkpoint166-validation.json')],
      externalSourceLabel:'TUM_SOURCE; relative paths below refer to this frozen source, never to user data'},
    fullEraCompatibility:false,limitations,statusLegend:{'validated-source-contract':'Exact source contract has explicit passing native evidence.',
      partial:'Named behavior linked; whole event parity not established.',
      'implemented-unverified':'Adapter linked; native validation not established for the whole event.',
      'offline-adapter-only':'Strict offline compiler/interpreter; production execution is not asserted.',
      unassessed:'No exact proof binding; existing behavior may cover this rule.',
      'availability-only':'Definition is registered; behavior parity is a separate question.'},
    summary:{sourceScripts:scripts.length,triggerDeclarations:scripts.reduce((n,s)=>n+s.triggerCount,0),
      postTriggerDeclarations:scripts.reduce((n,s)=>n+s.postTriggerCount,0),initializationSections:events.filter(e=>e.kind==='initialization').length,eventStatuses:countBy(events,'status'),
      sourceCreatures:creatures.length,creatureConfigs:creatureConfigs.length,creaturePropertyRules:creatureRules.length,
      globalConfigs:globalConfigs.length,globalConfigRules:globalConfigRules.length,sourcePlugins:plugins.length,
      resolvedCreatureConfigs:creatureConfigs.filter(c=>c.nativeId).length,experienceRules:xpRules.length,xpStatuses:countBy(xpRules,'status'),
      artifacts:artifacts.length,activeArtifacts:artifacts.filter(a=>a.active).length,artifactPropertyRules:artifactRules.length,
      banks:banks.length,registeredBanks:banks.filter(b=>b.nativeDefinitions.length).length,objectDefinitions:objectDefinitions.length,
      sourceReplacers:replacers.length,acceptedOfflineReplacers:replacers.filter(r=>r.sourceId).length,wogModules:sourceModules.length,
      dwellings:dwellings.length,registeredDwellings:dwellings.filter(d=>d.nativeDefinitions.length).length},
    scripts:scriptsSummary,events,creatures,creatureConfigs,creatureRules,globalConfigs,globalConfigRules,plugins,experienceRules:xpRules,artifacts,artifactRules,
    uncataloguedArtifactConfigs,banks,dwellings,dwellingSource:{source:'Data/AmeCre.pac::DwTable.txt',sha256:sha256(dwBytes),parser:reference(dwellingSource)},
    objectDefinitions,replacers,wogModules:sourceModules,sourceFiles:sorted(sourceFiles.keys()).map(k=>sourceFiles.get(k)),
    nativeMechanisms:bindings.mechanisms.map(m=>({...m,implementation:m.implementation.map(reference),evidence:m.evidence.map(reference)})),
    backlog:bindings.backlog};
}

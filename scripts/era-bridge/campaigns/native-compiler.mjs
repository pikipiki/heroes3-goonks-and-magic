/** Explicit source repairs for the four shipped campaign archives.
 * Original archives remain unchanged; every repair is pinned and recorded.
 */
import {compileErm, tokenizeErm} from './parser.mjs';
import {readOriginalCampaign, sha256} from './importer.mjs';

const repairs = new Map([
 ['8c4a286b4473d3dd3d5c2445b7510d737a6c440ae3a3c0c06eb0c1609cb25231', {
  from: '!!VRv533&v536=1+1;', to: '!!VRv533&v536=1:+1;',
  reason: 'Missing receiver colon in the fourth of four adjacent completed-task counter increments.',
 }],
 ['e0645fc091b592f2bf4db6db18d928ee9a0986c6c36bf403f440a633b4d8de27', {
  from: '!!IF&6v1=1:M', to: '!!IF&v1=1:M',
  reason: 'Malformed quest condition; the surrounding Shrubbery quest stores its states0/1/2/3 in v1 and never sets flag6.',
 }],
 ['10fdccc80fb2fde9c190665d1ff3611f8369e4cf0e192ebcc0d68b728344d5fb', {
  from: '!?OB58/61/1\n', to: '!?OB58/61/1;\n',
  reason: 'Missing trigger terminator before the explicit portal interaction message.',
 }],
 ['a7feeeba4b505caf980926de5562cdc5209d14adc68b3c29b451ee24a2546748', {
  from: '!!OB66/22/1:S\n', to: '!!OB66/22/1:S;\n',
  reason: 'Missing receiver terminator before the separate hero teleport command.',
 }],
]);
const detachedSource = '71bd544f3809aaf38ecae9d85abad4d14716fa3e4111870af7fafe4d7d2efc7f';

export function compileNativeSource(source) {
 const original = source.bytes, originalSha256 = sha256(original);
 if (source.sha256 !== originalSha256) throw Error('Campaign source identity changed');
 let text = original.toString('utf8');
 const exceptions = [];
 const repair = repairs.get(originalSha256);
 if (repair) {
  const at = text.indexOf(repair.from);
  if (at < 0 || text.indexOf(repair.from, at + 1) >= 0) throw Error('Pinned campaign repair no longer unique');
  text = text.slice(0, at) + repair.to + text.slice(at + repair.from.length);
  exceptions.push({kind: 'syntax-repair', originalSha256, ...repair});
 }
 if (originalSha256 === detachedSource) {
  const bytes = Buffer.from(text), tokens = tokenizeErm(bytes, {source: source.id});
  const first = tokens.find(token => token.statement.startsWith('!?'));
  if (!first) throw Error('Missing first active source trigger');
  const detached = tokens.filter(token => token.offset < first.offset && token.statement.startsWith('!!'));
  if (!detached.length) throw Error('Missing pinned detached campaign receivers');
  // The four source trigger headings are explicitly commented out. Keep their
  // receiver bodies inactive while retaining the independent !# initializer.
  for (const token of detached) {
   for (let at = token.offset; at < token.endOffset; at++) if (bytes[at] !== 10 && bytes[at] !== 13) bytes[at] = 32;
   exceptions.push({kind: 'detached-disabled-receiver', originalSha256, line: token.line, instructionSha256: token.sha256, statement: token.statement});
  }
  text = bytes.toString('utf8');
 }
 const program = compileErm(Buffer.from(text), {source: source.id});
 return {...program, originalSha256, exceptions};
}

export function compileNativeCampaign(file) {
 const campaign = readOriginalCampaign(file);
 return {
  sourceArchiveSha256: campaign.sha256,
  scenarios: campaign.maps.map(map => {
   const programs = map.sources.map(compileNativeSource);
   let previousBlocks = 0;
   const initializers = [];
   for (const program of programs) {
    for (const command of program.initializers)
     initializers.push({...command, visibleBlocks: previousBlocks + command.visibleBlocks});
    previousBlocks += program.blocks.length;
   }
   // A map has one ERM environment: variables and functions cross source events.
   const program = {schemaVersion: 1, contract: 'source-campaign-erm-ast-v1',
    source: campaign.name + '!' + map.member, mapSha256: map.mapSha256,
    sources: programs.map((p, index) => ({id: p.source, originalSha256: p.originalSha256,
     compiledSha256: p.sha256, firstOccurrence: map.sources[index].firstOccurrence,
     eventIndex: map.sources[index].eventIndex, exceptions: p.exceptions})),
    initializers, blocks: programs.flatMap(p => p.blocks)};
   program.sha256 = sha256(Buffer.from(JSON.stringify(program)));
   return {member: map.member, mapSha256: map.mapSha256, programs, program};
  }),
  executionValidated: false,
 };
}

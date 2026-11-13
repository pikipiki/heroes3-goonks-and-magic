/** Audit shipped spell descriptors + native loader, without launching a browser. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {readEraArchive} from '../resources.mjs';
import {readQuotedTsv} from '../objects/spell-catalog.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync('game-data/manifest.json'));
const archives=[];
for(const file of manifest.files.filter(f=>/^Data\/H3(?:bitmap|ab_bmp)\.lod$/i.test(f.path))){
 const bytes=Buffer.concat(file.chunks.map(c=>{const b=fs.readFileSync('game-data/chunks/'+c.hash+'.bin');if(sha(b)!==c.hash)throw Error('Chunk mismatch');return b;}));
 if(sha(bytes)!==file.hash)throw Error('Archive mismatch');
 const archive=readEraArchive(bytes),text=archive.extract('SPTRAITS.TXT');
 const rows=readQuotedTsv(text.toString('latin1')).filter(r=>r.length>28&&r[0]&&r[1]&&/^\d+$/.test(r[2]));
 if(rows.length!==81||rows[75][0]!=='Age')throw Error('Spell identity mismatch');
 archives.push({path:file.path,sha256:file.hash,memberSha256:sha(text),spells:[70,71,73,74,75,80].map(id=>({id,name:rows[id][0],level:Number(rows[id][2])}))});
}
if(archives.length!==2||archives.some(a=>a.spells.find(s=>s.id===75).level!==5))throw Error('Unproven Age5');
const sources=['work/vcmi-wasm/lib/spells/CSpellHandler.cpp','work/vcmi-wasm/lib/modding/ContentTypeHandler.cpp','work/vcmi-wasm/config/spells/ability.json','work/vcmi-wasm/lib/spells/ISpellMechanics.cpp'];
const report={archives,nativeLoader:sources.map(path=>({path,sha256:sha(fs.readFileSync(path))})),derivation:['loadLegacyData stores SPTRAITS column2 in originalData[index].level for all81 descriptors, including abilities.','ContentTypeHandler merges core indexed JSON onto originalData; ability.json age index75 has no level override.','CSpellHandler.loadFromJson stores merged level; CSpell.getLevel and BaseMechanics.getSpellLevel return it directly. Ability does not imply level0.','BattleCast.setSpellLevel changes mastery, not descriptor level.'],conclusion:'core:age is level5 in the shipped native content; source339 context must treat Age5, Poison0, Paralyze4.',runtimeControlPending:true,openCompatibilityObligation:'Existing statusPrimaryAccuracy unconditional Ward134 block for intrinsicAge75 remains to audit separately; no published mechanic is changed by this audit.'};
const out=process.argv[2];if(out)fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');else console.log(JSON.stringify(report,null,2));

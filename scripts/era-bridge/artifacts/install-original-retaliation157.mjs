/** Activate original157 by patching its existing WoG identity, never adding another artifact. */
import fs from'node:fs';import path from'node:path';import{validateOriginalRetaliationShield}from'./original-retaliation157.mjs';import{parseJsonc}from'./importer.mjs';
const[review,report='outputs/wog-priorities-0.4.147']=process.argv.slice(2);if(!review)throw Error('REVIEW [REPORT_DIR] required');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
if(read(report+'/native-original-retaliation157.json').passed!==true)throw Error('Matching complete native157 proof required');
const definitions=read(review+'/definition.candidate.json'),shield=definitions.crimsonShieldOfRetribution;
if(Object.keys(definitions).join(',')!=='crimsonShieldOfRetribution'||shield?.bonuses?.defence?.val!==2||Object.values(shield.bonuses).some(b=>b.type==='CREATURE_DAMAGE'))throw Error('Original157 replacement is incomplete');
const policy=validateOriginalRetaliationShield(read(review+'/runtime.candidate.json'));
write('mod/wake-of-gods/Mods/artifacts/content/config/artifacts/crimsonShieldOfRetribution.json',definitions);
write('mod/tum-era/content/config/era-original-retaliation-shield.json',policy);
const frenchPath='mod/wake-of-gods/content/translation/french.json',french=parseJsonc(fs.readFileSync(frenchPath,'utf8')),key='artifact.wake-of-gods.artifacts.crimsonShieldOfRetribution';
french[key+'.name']='Bouclier cramoisi de représailles';french[key+'.description']='{Bouclier cramoisi de représailles}\n\nDéfense+2. Les créatures du héros peuvent riposter même lorsque l’attaquant bloque les ripostes. Les compteurs disponibles et les états qui empêchent la riposte continuent de s’appliquer.';write(frenchPath,french);
write(report+'/original-retaliation157-review.json',read(review+'/source-review.json'));console.log('Enabled original WoG157 on the existing artifact identity; removed only the alternate50percent damage adaptation.');

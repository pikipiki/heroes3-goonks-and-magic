import {compileEraSpellFilters} from './bank-extras.mjs';
/** Standard quoted TSV: SPTRAITS descriptions contain embedded tabs/newlines. */
export function readQuotedTsv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c==='\t'||c==='\n')){row.push(field.replace(/\r$/,''));field='';if(c==='\n'){rows.push(row);row=[];}}else field+=c;}if(quoted)throw new Error('Unclosed quoted SPTRAITS field');if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row);}return rows;}
/** Complete indexed original H3 catalog. Only the two category bits needed to
 * establish flags!=0 are known from SPTRAITS; custom flags masks are rejected.
 * Full executable flag words must never be inferred from the reference column.
 */
export function readDefaultFlagSpellCatalog(text,{spellIds}={}){
 const rows=readQuotedTsv(text).filter(row=>row.length>=34&&/^\d+$/.test(row[2]));
 if(rows.length!==81)throw new Error(`Expected81 original SPTRAITS entries, got${rows.length}`);
 return rows.map((row,eraId)=>{const level=Number(row[2]);if(level>5)throw new Error('Invalid original spell level');const schoolBits=[8,4,2,1].reduce((bits,flag,i)=>bits|(row[i+3].trim().toLowerCase()==='x'?flag:0),0);const attrs=row.at(-1);const knownNonzeroFlags=/\bCOMBAT_SPELL\b/.test(attrs)?1:/\bADV_SPELL\b/.test(attrs)?2:/\bCREATURE_SPELL\b/.test(attrs)?8:0;const native=spellIds.get(eraId);if(!native)throw new Error(`Unresolved original spell${eraId}`);return {eraId,nativeId:'core:'+native,name:row[0],level,schoolBits,flags:knownNonzeroFlags,flagsUnknown:!knownNonzeroFlags,flagsEvidence:'SPTRAITS category proves nonzero, not complete flags word',nativeSpecial:eraId>=70};});
}
export function compileDefaultFlagSpellFilters(filters,{spellCatalog}={}){
 if(filters.some(s=>s.bits?.flags))throw new Error('Custom flags masks require complete executable flags catalog');
 for(const filter of filters){const levels=filter.bits?.levels||62,schools=filter.bits?.schools||15;if(spellCatalog.some(s=>s.eraId<70&&s.flagsUnknown&&(levels&(1<<s.level))&&(schools&s.schoolBits)))throw new Error('Selected original spell needs complete executable flags evidence');}
 return compileEraSpellFilters(filters,{spellCatalog});
}

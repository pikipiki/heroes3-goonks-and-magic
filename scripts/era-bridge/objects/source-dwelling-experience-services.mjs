/** Exact new-actor rows sharing existing source arithmetic/target selectors. */
const step=n=>Array.from({length:11},(_,i)=>i*n);
export const DWELLING_C_ROWS=Object.freeze({274:[[78,step(5)]],276:[[71,step(5)]],282:[[78,step(5)]],284:[[71,step(5)],[54,Array(11).fill(100)]],325:[[75,step(8)]],326:[[71,step(5)]],327:[[71,step(5)]],335:[[71,[0,5,10,15,20,25,35,45,55,65,75]]],336:[[71,[5,10,20,30,40,50,60,70,80,90,100]]]});
export function dwellingExperienceRuntimeRows(id,rows){return rows.filter(r=>
 (id===312&&r.code==='E')||(r.code==='c'&&Object.hasOwn(DWELLING_C_ROWS,id))||([292,307,308,313,327,336].includes(id)&&r.code==='L')||([270,279].includes(id)&&r.code==='b')||([277,285,311].includes(id)&&r.code==='w'&&r.modifier==='C'));}
export function compileDwellingExperienceServices(id,rows,definition,runtime,sourceCache){
 const consumed=dwellingExperienceRuntimeRows(id,rows),evidence=[];
 const exact=(row,modifier,values)=>{if(row.modifier!==modifier||JSON.stringify(row.values)!==JSON.stringify(values))throw Error('Changed source dwelling experience '+id+' '+row.code+modifier);};
 const curve=(name,bonus,values)=>{const base=values[0];if(base)definition.abilities[name]={...bonus,val:base};const delta=values.slice(1).map(v=>v-base);if(delta.some(Boolean))definition.stackExperience.push({bonus,values:delta});};
 for(const row of consumed){
  evidence.push({sourceId:id,sourceLine:row.line,code:row.code,modifier:row.modifier,values:row.values,scope:'Exact source new-actor row',native:'existing source primitive with scoped new actor admission'});
  if(row.code==='E'){exact(row,'=',step(1));curve('sourceDeathStare',{type:'DEATH_STARE',subtype:'deathStareGorgon',valueType:'ADDITIVE_VALUE'},row.values);evidence.push({source:'E312 source0..10; same original perattacker roll/gorgon cap as253, scopedEraBankDeathStare312',nativeValidationRequired:true});}
  if(row.code==='L'){exact(row,id===292?'#125':'#49',step(id===292?6:5));runtime.physicalDeflection={modifier:id===292?125:49,values:[...row.values]};}
  if(row.code==='b'){exact(row,'=',step(4));curve('sourceDefenseReduction',{type:'ERA_EXPERIENCE_DEFENSE_REDUCTION',valueType:'ADDITIVE_VALUE'},row.values);}
  if(row.code==='w'){exact(row,'C',[0,0,0,0,0,1,1,1,1,1,1]);for(const spell of['iceBolt','frostRing'])definition.stackExperience.push({bonus:{type:'SPELL_IMMUNITY',subtype:'core:'+spell},values:row.values.slice(1).map(Boolean)});}
 }
 const expected=DWELLING_C_ROWS[id];
 if(expected){const actual=consumed.filter(r=>r.code==='c');if(actual.length!==expected.length)throw Error('Changed source c row count '+id);for(let i=0;i<expected.length;i++)exact(actual[i],'#'+expected[i][0],expected[i][1]);const cached=sourceCache.table.map((r,slot)=>r?.code==='c'?{...r,slot}:null).filter(Boolean);const effective=cached.at(-1);if(!effective||effective.modifier!==expected.at(-1)[0]||JSON.stringify(effective.chances)!==JSON.stringify(expected.at(-1)[1]))throw Error('Changed source final c cache '+id);evidence.push({scope:'last active c row in original14-slot cache, one proc',effective,shadowed:cached.slice(0,-1),native:'EraDwellingExperienceSelectors.h',source:'h3era71D81A..71D86E overwrites until slot14 before71D8B0 single roll'});}
 return{consumedRows:consumed,evidence};
}

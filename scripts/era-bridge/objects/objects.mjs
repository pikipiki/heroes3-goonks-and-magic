import {createHash} from 'node:crypto';
/** Original TUM object data -> native VCMI definitions. No numeric ID guessing. */
export class ObjectBridgeError extends Error {
  constructor(code, message, details = {}) { super(message); this.name='ObjectBridgeError'; this.code=code; this.details=details; }
}
const fail=(code,message,details)=>{throw new ObjectBridgeError(code,message,details);};
const integer=(n,field,min=0,max=Number.MAX_SAFE_INTEGER)=>{
  if(!Number.isSafeInteger(n)||n<min||n>max)fail('INVALID_INTEGER',`Invalid ${field}`,{value:n}); return n;
};
const terrainNames=['dirt','sand','grass','snow','swamp','rough','subterranean','lava','water'];
// These numeric top-visitable constants MUST come from the caller's engine catalog.
// Creature/hero/artifact/resource legacy template categories (2..5) are unconditional.
export function convertObjectTemplate(line,{maskBytes,topVisitableObjectIds=[],animationPrefix=''}={}) {
  if(typeof line!=='string')fail('INVALID_TEMPLATE','Template must be text');
  const p=line.trim().split(/\s+/);
  if(p.length!==9||!p[0]||!/^[01]{48}$/.test(p[1])||!/^[01]{48}$/.test(p[2])||!p.slice(3,5).every(x=>/^[01]{9}$/.test(x)))fail('INVALID_TEMPLATE','Expected H3 template: animation, 2x48 mask bits, 2x9 terrain bits, 4 integers',{line});
  const [objectType,objectSubtype,category,priority]=p.slice(5).map(Number);
  for(const [key,val] of Object.entries({objectType,objectSubtype,category,priority}))integer(val,key,0,2147483647);
  let width=8,height=6;
  if(maskBytes!==undefined){
    if(!(maskBytes instanceof Uint8Array)||maskBytes.length<2)fail('INVALID_MSK','MSK requires width and height bytes');
    width=integer(maskBytes[0],'MSK width',1,8);height=integer(maskBytes[1],'MSK height',1,6);
  }
  const mask=[];
  // readTxt uses usedTiles[y][x]; readJson reverses [height-1-y][width-1-x].
  for(let y=height-1;y>=0;y--){let row='';for(let x=width-1;x>=0;x--){const i=y*8+x,b=p[1][i]==='0',v=p[2][i]==='1';
    if(v&&!b)fail('UNREPRESENTABLE_MASK','Native masks cannot preserve an unblocked visitable tile',{line,index:i});
    row+=v?'A':b?'B':'V';}mask.push(row);}
  const allowedTerrains=terrainNames.filter((_,i)=>p[4][8-i]==='1');
  const anyLandTerrain=allowedTerrains.length>=8&&!allowedTerrains.includes('water');
  const allDirections=[2,3,4,5].includes(category)||topVisitableObjectIds.includes(objectType);
  return {objectType,objectSubtype,category,editorTerrainBits:p[3],template:{animation:animationPrefix+p[0],mask,visitableFrom:allDirections?['+++','+-+','+++']:['---','+-+','+++'],...(anyLandTerrain?{}:{allowedTerrains}),zIndex:priority*100},source:{line,width,height,mskApplied:maskBytes!==undefined}};
}

/** Parse both columns of AmeCre.pac/DwTable.txt. Row position is subtype, not portrait number. */
export function parseDwellingTable(text,{source='AmeCre.pac/DwTable.txt'}={}) {
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);const header=lines.shift();
  if(!header?.startsWith('TYPE 17 (one creature)'))fail('INVALID_DWELLING_TABLE','Unrecognized DwTable header',{source});
  const rows=[];
  for(let i=0;i<lines.length;i++){
    if(!lines[i].trim())continue;
    const cols=lines[i].split('\t');
    if(cols.length<8)fail('INVALID_DWELLING_TABLE','DwTable row has fewer than eight fields',{source,line:i+2});
    const id=(value,field)=>{const m=/^(-?\d+)(?:\s.*)?$/.exec(value.trim());if(!m)fail('INVALID_DWELLING_TABLE',`Invalid ${field}`,{source,line:i+2,value});return integer(Number(m[1]),field,-1);};
    const common=id(cols[1],'creature');
    if(common>=0)rows.push({objectType:17,objectSubtype:i,name:cols[0],creatureIds:[common],portraitFrame:id(cols[2],'portraitFrame'),source:{file:source,line:i+2}});
    const multi=cols.slice(4,8).map((v,j)=>id(v,`creature ${j}`)).filter(n=>n>=0);
    if(multi.length)rows.push({objectType:20,objectSubtype:i,name:cols[3],creatureIds:multi,portraitFrame:cols[8]?.trim()?id(cols[8],'portraitFrame'):null,source:{file:source,line:i+2}});
  }
  return rows;
}
const resolve=(fn,id,field)=>{if(typeof fn!=='function')fail('MISSING_RESOLVER',`Explicit ${field} resolver required`);const value=fn(id);if(typeof value!=='string'||!value)fail('UNRESOLVED_ID',`Unresolved ${field} ${id}`,{id});return value;};
/** Guards MUST be supplied from verified ERA behavior; VCMI level>=5 defaults are not silently assumed. */
export function compileDwelling(row,{templates,resolveCreature,guards,nativeRmg,name=row.name,objectId=`dwelling${row.objectSubtype}`}={}) {
  if(![17,20].includes(row.objectType)||!row.creatureIds?.length)fail('INVALID_DWELLING','Invalid dwelling row');
  if(!templates||!Object.keys(templates).length)fail('MISSING_TEMPLATES','Dwelling needs converted native templates');
  if(guards===undefined)fail('UNVERIFIED_GUARDS','Provide explicit verified guard stacks or boolean');
  let nativeGuards;
  if(typeof guards==='boolean')nativeGuards=guards;
  else if(Array.isArray(guards))nativeGuards=guards.map(g=>({type:resolve(resolveCreature,integer(g.creatureId,'guard creature'),'creature'),amount:integer(g.amount,'guard amount',1)}));
  else fail('INVALID_GUARDS','Guards must be a boolean or list of source-ID stacks');
  const group=row.objectType===17?'core:creatureGeneratorCommon':'core:creatureGeneratorSpecial';
  const type={name,creatures:row.creatureIds.map(id=>[resolve(resolveCreature,id,'creature')]),guards:nativeGuards,templates};
  if(nativeRmg!==undefined){for(const [key,value] of Object.entries(nativeRmg)){if(!['value','rarity','mapLimit','zoneLimit','neutralAllowed'].includes(key))fail('UNSUPPORTED_DWELLING_RMG','Unknown native dwelling RMG field',{key});if(key==='neutralAllowed'){if(typeof value!=='boolean')fail('INVALID_DWELLING_RMG','neutralAllowed must be boolean');}else integer(value,'native RMG '+key);}type.rmg=structuredClone(nativeRmg);}
  return {definition:{[group]:{types:{[objectId]:type}}},source:{...row,portraitFrame:row.portraitFrame},deferred:[]};
}

/** Strictly extracts the 7-slot parameterized replacement program, preserving source slot order. */
export function parseReplacementScript(text,{source='<ERM>'}={}){
 const params=new Map();let id;
 for(const m of text.matchAll(/!#VRi\^CB_(\d{2,3})_(\w+)\^:S(-?\d+);/g)){
   if(id!==undefined&&id!==m[1])fail('MIXED_REPLACER_IDS','Mixed replacement IDs',{source});id=m[1];
   if(params.has(m[2]))fail('DUPLICATE_PARAMETER','Duplicate replacement parameter',{source,key:m[2]});params.set(m[2],Number(m[3]));
 }
 if(id===undefined)fail('INVALID_REPLACER','No replacement parameters',{source});
 const get=k=>{if(!params.has(k))fail('MISSING_PARAMETER',`Missing ${k}`,{source});return params.get(k);};
 const body=text.slice(text.indexOf('!?FU(OnEveryDay)'));
 const trigger=body.split(/\r?\n/)[0];
 if(!['!?FU(OnEveryDay)&i^tum_isRandMap^<>(TRUE)/i^tum_replaceObj_on^;','!?FU(OnEveryDay)&i^tum_replaceObj_on^;'].includes(trigger))fail('UNSUPPORTED_TRIGGER','Unknown replacement trigger',{source,trigger});
 const commands=(body.match(/!![^;\r\n]*;/g)||[]).map(x=>x.replace(/CB_\d+_/g,'CB_N_').replace(/\s+/g,''));
 if(createHash('sha256').update(commands.join('\n')).digest('hex')!=='7315326b5038278b1c2cb309d757134d702733bb4382bfdad5223a0dd10ff2f1')fail('UNSUPPORTED_REPLACER_BODY','Runtime instruction stream differs from audited original',{source});
 const semantics=[/!!if&x1=1\/x3=1:/,/!!re i\/0\/6\/1:/,/!!UN:Uy3\/-1\/\?y6;/,/!!VRv2:S-1;/,/!!UN:Ux1\/-1\/-1\/2;/,/!!VRy2:S0T99;/,/!!if&x5>y2:/,/!!VRy30:Sv2\+x6;/,/!!if&x1=y5\/x2=y6\/y30<=y10\/y30>=0:/,/!!UN:Ov2\/v3\/v4\/0\/0;/,/!!UN:Iv2\/v3\/v4\/x3\/x4\/x3\/x4\/-1\/0;/,/!!POv2\/v3\/v4:N3;/];
 if(semantics.some(re=>!re.test(text)))fail('UNSUPPORTED_REPLACER_BODY','Replacement body differs from audited TUM program',{source,id});
 const allowed=new Set(['Type_Number','SubType_Number','Replace_Objects']);const rules=[];
 for(let slot=0;slot<=6;slot++){const prefix=`Replace_${slot}_`;for(const k of ['Type_Number','SubType_Number','Percentage','X_Offset'])allowed.add(prefix+k);
 const type=integer(get(prefix+'Type_Number'),'source type',-1),subtype=integer(get(prefix+'SubType_Number'),'source subtype',-1),percentage=integer(get(prefix+'Percentage'),'percentage',0,100),xOffset=integer(get(prefix+'X_Offset'),'xOffset',-2147483648,2147483647);
 rules.push({slot,sourceType:type,sourceSubtype:subtype,percentage,xOffset,enabled:type>=0&&subtype>=0&&percentage>0});}
 for(const key of params.keys())if(!allowed.has(key))fail('UNKNOWN_PARAMETER','Unknown replacement parameter',{source,key});
 return {id,source,enabled:Boolean(integer(get('Replace_Objects'),'enabled',0,1)),targetType:integer(get('Type_Number'),'target type'),targetSubtype:integer(get('SubType_Number'),'target subtype'),rules,conditions:{day:1,firstPlayer:true,randomMap:/tum_isRandMap/.test(text.slice(text.indexOf('!?FU(OnEveryDay)')))?false:null,setting:'tum_replaceObj_on'},random:{min:0,max:99,consume:'every object of sourceType, including nonmatching subtypes'},placement:{xBoundsCheck:true,otherBoundsOrCollisionCheck:false,poN:3,setCoordinateFlag:true},requiredHook:'server:first-day-before-first-player-turn'};
}

/** Engine-independent interpreter; adapters provide source-order scanning and atomic delete/create.
 * Adapters implement the ERA UN:U type-only coordinate cursor (not object-ID iteration).
 * The original type count is captured before each slot; the cursor is updated after offset placement.
 * Map changes of earlier slots/programs remain visible. RNG is consumed BEFORE subtype/bounds check.
 */
export function validateReplacementPlans(plans){
 const ids=new Set();
 for(const plan of plans){if(ids.has(plan.id))fail('COLLIDING_REPLACER_IDS','Original ERM scripts share global parameter/function IDs; resolve with verified precedence before execution',{id:plan.id});ids.add(plan.id);}
 return true;
}
export function executeReplacementPlan(plans,adapter,{day,firstPlayer,randomMap,enabled}={}){
 if(day!==1||!firstPlayer||!enabled)return {replaced:0,draws:0};
 validateReplacementPlans(plans);
 let replaced=0,draws=0;
 for(const plan of plans){if(!plan.enabled||(plan.conditions.randomMap===false&&randomMap))continue;for(const rule of plan.rules){if(!rule.enabled)continue;
 const count=integer(adapter.countType(rule.sourceType),'object count');adapter.resetSearch();
 for(let index=0;index<count;index++){const object=adapter.findNextType(rule.sourceType);const roll=integer(adapter.randomInt(0,99),'random roll',0,99);draws++;
 if(roll>=rule.percentage)continue;
 const current=adapter.getObject(object);if(!current||current.type!==rule.sourceType||current.subtype!==rule.sourceSubtype)continue;
 const position={...current.position,x:current.position.x+rule.xOffset};if(position.x<0||position.x>=adapter.width)continue;
 adapter.replaceObject(object,{type:plan.targetType,subtype:plan.targetSubtype,position,poN:3,flag:`CB_${plan.id}_Set_Flag_${position.x}_${position.y}_${position.z}`});adapter.setSearchPosition(position);replaced++;
 }}}
 return {replaced,draws};
}

/** Build native object-type template patches. Identity is explicitly resolved to avoid
 * attaching TUM numeric subtypes to unrelated VCMI mod allocations.
 * The returned patch merges with independently compiled dwelling/bank logic.
 */
export function compileTemplateCatalog(rows,{resolveObject}={}){
 if(typeof resolveObject!=='function')fail('MISSING_RESOLVER','Explicit native object identity resolver required');
 const definition={};const assets=new Set();
 for(let index=0;index<rows.length;index++){
  const row=rows[index];if(row.error||!row.template)fail('INVALID_TEMPLATE_ROW','Cannot emit a failed/unconverted template',{index});
  const identity=resolveObject(row.objectType,row.objectSubtype);
  if(!identity||typeof identity.group!=='string'||!identity.group||typeof identity.type!=='string'||!identity.type)fail('UNRESOLVED_OBJECT','Cannot resolve original object type/subtype',{objectType:row.objectType,objectSubtype:row.objectSubtype});
  const group=definition[identity.group]??={types:{}};
  const type=group.types[identity.type]??={templates:{}};
  type.templates[`eraTemplate${index}`]=structuredClone(row.template);assets.add(row.template.animation);
 }
 return {definition,assets:[...assets].sort()};
}

/** Verified h3era.exe0x4B8760: each dwelling slot guards iff source level>=4
 * (zero-based), with three times its weekly growth. Stats resolver must be
 * sourced from the same creature ruleset; callers declare level indexing.
 */
export function eraDwellingGuards(row,{resolveStats,levelBase}={}){
 if(typeof resolveStats!=='function')fail('MISSING_RESOLVER','Explicit creature stats resolver required');
 if(![0,1].includes(levelBase))fail('MISSING_LEVEL_BASE','Explicit levelBase0 or1 required');
 const guards=[];
 for(const id of row.creatureIds){const stats=resolveStats(id);
  if(!stats)fail('UNRESOLVED_STATS','No source stats for dwelling creature',{id});
  const level=integer(stats.level,'creature level',levelBase),growth=integer(stats.growth,'creature growth');
  if(level-levelBase>=4&&growth>0)guards.push({creatureId:id,amount:integer(growth*3,'guard amount',1)});
 }
 return guards;
}

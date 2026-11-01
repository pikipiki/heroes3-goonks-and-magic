import {BridgeError} from './resources.mjs';
const error=(message,source,line,code='UNSUPPORTED_ERM')=>{throw new BridgeError(code,message,source+':'+line);};
export function compileErmDefinitions(text,{source='<ERM>',constants={},resolveCreature,resolveTown,baselineTowns={}}={}){
 const symbols=new Map(Object.entries(constants));const creatures={},factions={},operations=[];let event='initialization';
 const integer=(token,line)=>{const key=token.trim().replace(/^\(([^)]+)\)$/,'$1');const n=/^-?\d+$/.test(key)?Number(key):symbols.get(key);if(!Number.isSafeInteger(n))error('Unresolved constant '+token,source,line,'UNRESOLVED_CONSTANT');return n;};
 const creature=(n,line)=>{const id=resolveCreature?.(n);if(typeof id!=='string'||!/^[-a-zA-Z0-9_.]+:[-a-zA-Z0-9_.]+$/.test(id))error('Unresolved ERA creature '+n,source,line,'UNRESOLVED_CREATURE');return id;};
 for(const [offset,lineText]of text.split(/\r?\n/).entries()){
  const line=offset+1,s=lineText.trim();if(!s||s.startsWith(';')||s.startsWith('//')||s==='ZVSE2'||s==='ZVSE')continue;
  const pieces=s.split(';');if(pieces.slice(1).some(p=>/!!|!#|!\?/.test(p)))error('Multiple instructions on one line require an explicit adapter',source,line);const statement=pieces[0].trim(),declare=statement.match(/^!#DC\((\w+)\)\s*=\s*(-?\d+)$/);
  if(declare){const value=integer(declare[2],line);if(symbols.has(declare[1]))error('Duplicate constant '+declare[1],source,line,'DUPLICATE_CONSTANT');symbols.set(declare[1],value);continue;}
  const trigger=statement.match(/^!\?FU\((OnGameEnter|OnStartOrLoad)\)$/);if(trigger){event=trigger[1];continue;}
  const up=statement.match(/^!!MA:U([^/]+)\/([^/]+)$/);
  if(up){const from=integer(up[1],line),to=integer(up[2],line),a=creature(from,line),b=creature(to,line);if(from===to)error('Self-referential creature upgrade',source,line,'INVALID_UPGRADE');creatures[a] ||= {upgrades:[]};if(!creatures[a].upgrades.includes(b))creatures[a].upgrades.push(b);operations.push({type:'creature.upgrade',from,to,event,source,line});continue;}
  const town=statement.match(/^!!UN:T([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if(town){const townId=integer(town[1],line),level=integer(town[2],line),variant=integer(town[3],line),unit=integer(town[4],line),target=resolveTown?.(townId);
   if(typeof target!=='string'||!/^[-a-zA-Z0-9_.]+:[-a-zA-Z0-9_.]+$/.test(target))error('Unresolved ERA town '+townId,source,line,'UNRESOLVED_TOWN');
   if(level<0||level>7||variant<0||variant>5)error('Town level/variant outside VCMI limits',source,line,'INVALID_DWELLING');
   if(!factions[target]){const baseline=baselineTowns[target];if(!Array.isArray(baseline)||Array.from(baseline).some(row=>!Array.isArray(row)||!row.length||Array.from(row).some(id=>typeof id!=='string'||!id.trim())))error('A complete native town roster is required for '+target,source,line,'MISSING_TOWN_BASELINE');factions[target]={town:{creatures:structuredClone(baseline)}};}
   const rows=factions[target].town.creatures;if(!rows[level]||variant>rows[level].length)error('Town patch would create a sparse creature roster',source,line,'SPARSE_TOWN_ROSTER');rows[level][variant]=creature(unit,line);operations.push({type:'town.creature',town:townId,level,variant,eraId:unit,event,source,line});continue;
  }
  // No skipping of arbitrary ERM instructions, conditions, macros or x86 calls.
  error('Instruction has no verified native adapter: '+statement,source,line);
 }
 // Native definitions are declarative. Only unconditional initialization triggers
 // are accepted; stateful events cannot be mistaken for load-time assignments.
 const graph=new Map(Object.entries(creatures).map(([id,p])=>[id,p.upgrades]));
 const visiting=new Set(),visited=new Set();function visit(id){if(visiting.has(id))throw new BridgeError('UPGRADE_CYCLE','Creature upgrade cycle involving '+id,source);if(visited.has(id))return;visiting.add(id);for(const next of graph.get(id)||[])visit(next);visiting.delete(id);visited.add(id);}for(const id of graph.keys())visit(id);
 return {creatures,factions,provenance:{source,operations},nativeExecution:'VCMI creature and faction handlers'};
}

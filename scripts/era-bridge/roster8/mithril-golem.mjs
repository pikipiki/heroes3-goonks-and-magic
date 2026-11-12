/** Source324 construct is repair membership, never native MECHANICAL biology. */
export const SOURCE_MITHRIL_GOLEM_CONTRACT='source-mithril-golem-v1';
export function reviewedMithrilGolem(text,{sourceId,contract}={}){
 if(sourceId!==324||contract!==SOURCE_MITHRIL_GOLEM_CONTRACT)throw Error('Explicit reviewed Mithril Golem source contract required');
 const entries=text.trim().split(/\r?\n/).map(line=>line.split('=').map(v=>v.trim()));
 const expected={ResGen_Type:7,ResGen_Amount:1,Flags:131072,Level:5,Fearless:1,isConstruct:1};
 if(entries.length!==6||new Set(entries.map(([k])=>k)).size!==6||entries.some(([k,v])=>expected[k]===undefined||Number(v)!==expected[k]))throw Error('Unreviewed Mithril Golem CFG');
 return {ability:{type:'ERA_SOURCE_CONSTRUCT'},dailyResources:{resource:'wake-of-gods.mithril:mithril',amount:1,goldPerCreature:0},
  evidence:['Amethyst tables.cpp920:isCreatureConstruct returns explicit membership OR siege-weapon bit6',
  'Amethyst get_repair_constructs2300..2375:friendly construct/siege; living target must lose at least one whole creature',
  'Source flags131072:NO_MORALE only; ALIVE0,UNDEAD0,MIND0 independent from isConstruct',
  'Native sourceRepairTarget.eligible consumes membership without changing spell immunity or morale']};
}

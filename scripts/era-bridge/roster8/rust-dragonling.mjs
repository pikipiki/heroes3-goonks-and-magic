/** Source344 SpellEffect8 queues permanent acid defence only: no ATT_DISRUPT damage. */
export const SOURCE_RUST_DRAGONLING_CONTRACT='source-rust-dragonling-v1';
const fields={DoNotGenerate:1,Flags:-2147483501,Level:4,'Spell effect':8};
export function reviewedRustDragonling(text,{sourceId,contract}={}){
 if(sourceId!==344||contract!==SOURCE_RUST_DRAGONLING_CONTRACT)throw Error('Explicit whole source344 contract required');
 const entries=text.trim().split(/\r?\n/).map(l=>l.split('=').map(s=>s.trim()));if(entries.length!==Object.keys(fields).length||new Set(entries.map(([k])=>k)).size!==entries.length||entries.some(([k,v])=>!Object.hasOwn(fields,k)||Number(v)!==fields[k]))throw Error('Unreviewed Rust Dragonling CFG');
 return{consumedKeys:['Spell effect'],featurePolicy:{schemaVersion:1,creature:'tum-era:eraCreature344'},source:{selector:8,selectorTable:'Amethyst aftercast_abilities_jumptable[8]=0x44050A',conditions:'Primary alive count>0 and mutable defence>0; Toxic15 bypasses via Amethyst z_Hook_0044050A.',rng:'No selector RNG and no magic acceptance query.',queue:'Target+EC=80; original468C99 flushes side0/1 and slots, power3/mastery0/kind1.80 exempt globalpoweroverride.',effect:'Original acid spell80: cumulative permanent defence−3; no acid-damage selector4 is specified by this CFG.'}};
}

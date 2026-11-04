const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
/** Original source slot identities survive even when the first guardian slots are empty. */
export function compileEraBankGuardSlots(bank,{mode='strict'}={}){
 if(!['strict','native-original-slots'].includes(mode))fail('INVALID_GUARD_SLOTS_MODE','Unknown original guardian slots mode');
 const patterns=[];for(const state of bank.states||[]){const g=state.guardians;if(!Array.isArray(g?.type)||!Array.isArray(g?.count)||g.type.length!==7||g.count.length!==7)return undefined;patterns.push(g.type.flatMap((id,slot)=>id>=0&&g.count[slot]>0?[slot]:[]));}
 if(!patterns.some(p=>p.some((slot,index)=>slot!==index)))return undefined;
 if(mode!=='native-original-slots')fail('UNSUPPORTED_GUARD_SLOTS','Original sparse guardian slots require the native eraBankGuardSlots adapter; compression would lose their original world army slots');
 if(patterns.some(p=>JSON.stringify(p)!==JSON.stringify(patterns[0])))fail('STATE_DEPENDENT_GUARD_SLOTS','Original guardian slot pattern differs by state; no shared native policy is exact');
 return patterns[0];
}
/** H3 combat compacts occupied army slots: width and formation use the dense combat ordinal. */
export function resolveEraBankGuardLayout(id,bank,{resolveCreature,byNative,layouts}={}){
 if(bank.troopPlacement){const p=bank.troopPlacement;const valid=value=>/^[0-9]+$/.test(String(value))&&Number(value)>=1&&Number(value)<=186&&![0,16].includes(Number(value)%17);if(p.isBank!==true||![p.attackers,p.defenders].every(a=>Array.isArray(a)&&a.length===7&&a.every(valid)))return undefined;return{layoutId:'eraBank'+id+'OriginalLayout',baseLayout:structuredClone(layouts.creatureBankNarrow)};}
 const positions=[...layouts.creatureBankNarrow.defenderUnits],required=new Map();
 for(const state of bank.states){let ordinal=0;for(let slot=0;slot<7;++slot){const era=state.guardians.type[slot];if(era<0||state.guardians.count[slot]<=0)continue;const native=resolveCreature(era);if(!native)return 'creatureBankNarrow';const type=byNative.get(native);if(!type)fail('MISSING_NATIVE_GUARD_METADATA','Registered native guardian metadata is absent');const position=(type.doubleWide?layouts.creatureBankWide:layouts.creatureBankNarrow).defenderUnits[ordinal];if(required.has(ordinal)&&required.get(ordinal)!==position)return undefined;required.set(ordinal,position);positions[ordinal]=position;++ordinal;}}
 if(positions.every((x,i)=>x===layouts.creatureBankNarrow.defenderUnits[i]))return'creatureBankNarrow';const layout=structuredClone(layouts.creatureBankNarrow);layout.defenderUnits=positions;return{layoutId:'eraBank'+id+'MixedLayout',layout};
}

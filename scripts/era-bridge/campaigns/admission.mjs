/** Admission is bound to the unchanged archive and every compiled scenario. */
export function validateCampaignAdmission(id, campaign, compiled, receipt) {
 if(!receipt)return false;
 const check=(condition,message)=>{if(!condition)throw new Error(`Campaign ${id}: ${message}`);};
 check(receipt.schemaVersion===1&&receipt.id===id,'invalid admission receipt');
 check(receipt.sourceArchiveSha256===campaign.sha256,'source archive changed after validation');
 check(receipt.originalScriptsUnchanged===true&&receipt.questFlagsUnmodified===true,'original quest validation required');
 check(receipt.nativeCompletion?.won===true&&receipt.nativeCompletion?.campaign===true,'native campaign victory required');
 check(receipt.nativeCompletion.completedScenarios===compiled.scenarios.length,'incomplete campaign');
 check(/^[a-f0-9]{64}$/.test(receipt.engineSha256||''),'validated engine missing');
 check(receipt.scenarios?.length===compiled.scenarios.length,'scenario evidence missing');
 for(const [index,scenario]of compiled.scenarios.entries()){
  const evidence=receipt.scenarios.find(item=>item.id===`${id}-${index}`);
  check(evidence?.programSha256===scenario.program.sha256&&evidence.nativeVictory===true,'scenario victory or source binding missing');
 }
 check(receipt.transfers?.length===compiled.scenarios.length-1,'campaign transfers missing');
 const won=new Set(), destinations=new Set(), edges=new Map();
 for(const transfer of receipt.transfers){
  check(receipt.scenarios.some(s=>s.id===transfer.from)&&receipt.scenarios.some(s=>s.id===transfer.to)&&transfer.from!==transfer.to&&transfer.native===true,'invalid native transfer');
  check(!won.has(transfer.from)&&!destinations.has(transfer.to),'duplicate native transfer');won.add(transfer.from);destinations.add(transfer.to);edges.set(transfer.from,transfer.to);
 }
 const starts=receipt.scenarios.filter(s=>!destinations.has(s.id));
 check(starts.length===1,'transfers must form one campaign progression');
 const visited=new Set();let current=starts[0].id;
 while(current&&!visited.has(current)){visited.add(current);current=edges.get(current);}
 check(visited.size===compiled.scenarios.length&&!current,'transfers must connect every scenario without a cycle');
 return true;
}

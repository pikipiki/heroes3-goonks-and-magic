type BattleArt={battleId:number;ready:boolean;expected:number;rows:unknown[]};
export function waitForBattleArt(win:Window,battleId:number,signal:AbortSignal,onProgress:(done:number,total:number)=>void=()=>{}):Promise<void>{
 return new Promise((resolve,reject)=>{
  let timer:number|undefined;
  const cleanup=()=>{if(timer!==undefined)win.clearTimeout(timer);win.removeEventListener('goonk-crossover-art',check);signal.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(Error('Préparation du combat annulée.'));};
  const check=()=>{const art=(win as Window&{goonkCrossoverArt?:BattleArt}).goonkCrossoverArt;if(art?.battleId!==battleId)return;onProgress(art.rows.length,art.expected);if(art.ready){cleanup();resolve();}};
  if(signal.aborted){abort();return;}
  win.addEventListener('goonk-crossover-art',check);signal.addEventListener('abort',abort,{once:true});
  timer=win.setTimeout(()=>{cleanup();reject(Error('Les animations du combat ne sont pas prêtes. Reviens en classique pour réessayer.'));},30000);check();
 });
}

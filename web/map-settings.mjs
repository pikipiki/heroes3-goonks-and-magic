export const MAP_SETTINGS_KEY='heroes-goonk.map-settings';
export const MAP_SPEEDS=[{value:200,label:'Lente'},{value:150,label:'Normale'},{value:100,label:'Rapide'},{value:50,label:'Très rapide'},{value:25,label:'Maximum'},{value:0,label:'Instantanée'}];
export function parseMapSettings(value){
 try{const v=typeof value==='string'?JSON.parse(value):value;return v&&MAP_SPEEDS.some(s=>s.value===v.moveTime)&&typeof v.hideEnemyMoves==='boolean'?{moveTime:v.moveTime,hideEnemyMoves:v.hideEnemyMoves}:null;}catch{return null;}
}
export function createMapSettings({send,storage}={}){
 const store=()=>storage||globalThis.localStorage;let saved=null;try{saved=parseMapSettings(store()?.getItem(MAP_SETTINGS_KEY));}catch{}
 let value=saved||{moveTime:150,hideEnemyMoves:false},pending=null,ready=false;
 return {
  get current(){return {...value,ready,pending:!!pending};},
  observe(native){
   if(!Number.isFinite(native?.moveTime)||!Number.isFinite(native?.enemyMoveTime))return;
   const actual={moveTime:MAP_SPEEDS.some(s=>s.value===native.moveTime)?native.moveTime:150,hideEnemyMoves:native.enemyMoveTime<0};
   if(!ready){ready=true;if(saved){pending={...value};send(value);}else value=actual;return;}
   if(pending){if(native.moveTime===pending.moveTime&&native.enemyMoveTime===(pending.hideEnemyMoves?-1:pending.moveTime))pending=null;}else value=actual;
  },
  change(patch){const next=parseMapSettings({...value,...patch});if(!ready||!next)return false;value=next;pending={...next};let persisted=true;try{store().setItem(MAP_SETTINGS_KEY,JSON.stringify(next));}catch{persisted=false;}send(next);return persisted;}
 };
}

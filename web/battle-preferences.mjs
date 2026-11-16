const key='heroes-goonk.default-battle-view';
export function defaultBattleView(storage){try{return (storage??globalThis.localStorage)?.getItem(key)==='vertical'?'vertical':'classic';}catch{return 'classic';}}
export function setDefaultBattleView(value,storage){const view=value==='vertical'?'vertical':'classic';try{(storage??globalThis.localStorage)?.setItem(key,view);}catch{}return view;}

const movementKey='heroes-goonk.battle-one-click';let movementFallback=false;
export function battleOneClick(storage){try{return (storage??globalThis.localStorage)?.getItem(movementKey)==='true';}catch{return movementFallback;}}
export function setBattleOneClick(value,storage){movementFallback=!!value;try{(storage??globalThis.localStorage)?.setItem(movementKey,String(movementFallback));}catch{}globalThis.dispatchEvent?.(new Event('goonk-battle-click-preference'));return movementFallback;}

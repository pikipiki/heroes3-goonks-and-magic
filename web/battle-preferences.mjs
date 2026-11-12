const key='heroes-goonk.default-battle-view';
export function defaultBattleView(storage){try{return (storage??globalThis.localStorage)?.getItem(key)==='vertical'?'vertical':'classic';}catch{return 'classic';}}
export function setDefaultBattleView(value,storage){const view=value==='vertical'?'vertical':'classic';try{(storage??globalThis.localStorage)?.setItem(key,view);}catch{}return view;}

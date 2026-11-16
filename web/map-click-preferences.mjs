const key='heroes-goonk.map-two-clicks';let fallback=false;
export function mapTwoClicks(storage){try{return (storage??globalThis.localStorage)?.getItem(key)==='true';}catch{return fallback;}}
export function setMapTwoClicks(value,storage){fallback=!!value;try{(storage??globalThis.localStorage)?.setItem(key,String(fallback));}catch{}globalThis.dispatchEvent?.(new Event('goonk-map-click-preference'));return fallback;}

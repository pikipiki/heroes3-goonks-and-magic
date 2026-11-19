// Cache-busted imports and local previews must share one locale and observer.
// Two independent observers translating in opposite directions can otherwise
// keep the microtask queue busy indefinitely when the language changes.
const localeKey=Symbol.for('heroes-goonk.locale-session');
export const localeSession=globalThis[localeKey]??={language:'en',initialized:false,redraw:()=>{}};
if(!localeSession.initialized){localeSession.initialized=true;try{localeSession.language=localStorage.getItem('heroes-goonk.language')==='fr'?'fr':'en';}catch{}}
export const getLanguage=()=>localeSession.language;

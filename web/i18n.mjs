// Cache-busted imports and local previews must share one locale and observer.
// Two independent observers translating in opposite directions can otherwise
// keep the microtask queue busy indefinitely when the language changes.
const localeKey=Symbol.for('heroes-goonk.locale-session');
const localeSession=globalThis[localeKey]??={language:'en',initialized:false,redraw:()=>{}};
if(!localeSession.initialized){localeSession.initialized=true;try{localeSession.language=localStorage.getItem('heroes-goonk.language')==='fr'?'fr':'en';}catch{}}
export const getLanguage=()=>localeSession.language;
let dictionary={};if(typeof window!=='undefined')try{const response=await fetch(new URL('./i18n-dictionary.json',import.meta.url));dictionary=await response.json();}catch(error){console.error('Translation catalogue unavailable',error);}
// Keep the same translation rules available to DOM text and canvas renderers.
export function createTranslator(catalogue){
 // The first entry is the canonical label; later contextual synonyms must
 // not replace it (for example “Attack” as a stat is “Attaque”).
 const reverse={};for(const [fr,en]of Object.entries(catalogue))reverse[en]??=fr;
 const compile=(source,targets)=>{
  const protectedText=new Set(targets);
  const phrases=[...new Set([...Object.keys(source),...protectedText])].filter(s=>s.length>=3).sort((a,b)=>b.length-a.length);
  return {source,protectedText,phrases};
 };
 const rules={en:compile(catalogue,Object.values(catalogue)),fr:compile(reverse,Object.keys(catalogue))};
 return(value,lang='en')=>{
  const text=String(value??''),{source,protectedText,phrases}=rules[lang==='fr'?'fr':'en'];
  if(protectedText.has(text))return text;
  if(source[text])return source[text];
  // Reserve matches in the original text, longest first. Never feed translated
  // output into another rule, or translate inside an already localized name.
  const matches=[];
  for(const phrase of phrases){
   let offset=text.indexOf(phrase);
   while(offset!==-1){
    const end=offset+phrase.length,before=text[offset-1],after=text[end];
    if(!(before&&/\p{L}/u.test(before)&&/\p{L}/u.test(phrase[0]))&&
       !(after&&/\p{L}/u.test(after)&&/\p{L}/u.test(phrase.at(-1)))&&
       !matches.some(m=>offset<m.end&&end>m.offset))
     matches.push({offset,end,value:protectedText.has(phrase)?phrase:source[phrase]});
    offset=text.indexOf(phrase,offset+phrase.length);
   }
  }
  matches.sort((a,b)=>a.offset-b.offset);
  let result='',cursor=0;
  for(const m of matches){result+=text.slice(cursor,m.offset)+m.value;cursor=m.end;}
  result+=text.slice(cursor);
  // HP labels are often embedded in a live stat line rather than separate nodes.
  const from=lang==='fr'?'HP':'PV',to=lang==='fr'?'PV':'HP';
  return result.replace(new RegExp('(^|[^\\p{L}\\p{N}_])'+from+'(?=$|[^\\p{L}\\p{N}_])','gu'),(_,prefix)=>prefix+to);
 };
}
const translateText=createTranslator(dictionary);
export function translate(value,lang=getLanguage()){return translateText(value,lang);}
export function setLanguage(value){const language=value==='fr'?'fr':'en';localeSession.language=language;try{localStorage.setItem('heroes-goonk.language',language);}catch{}if(typeof document!=='undefined'){document.documentElement.lang=language;localeSession.redraw();window.dispatchEvent(new CustomEvent('goonk-language',{detail:{language}}));}return language;}
if(typeof document!=='undefined'&&!localeSession.observer&&!localeSession.pendingStart){
 localeSession.pendingStart=true;document.documentElement.lang=getLanguage();const originals=new WeakMap(),attributes=new WeakMap(),cache=new Map();
 const text=value=>{const key=getLanguage()+':'+value;if(cache.has(key))return cache.get(key);if(cache.size>3000)cache.clear();const t=translate(value);cache.set(key,t);return t;};
 const visit=node=>{if(node.nodeType===3){if(node.parentElement?.closest('script,style,code,[translate=no]'))return;const old=originals.get(node);let raw=node.nodeValue;if(old&&raw===old.last)raw=old.raw;const next=text(raw);originals.set(node,{raw,last:next});if(node.nodeValue!==next)node.nodeValue=next;}else if(node.nodeType===1){if(node.matches('script,style,code,[translate=no]'))return;for(const key of ['aria-label','title','placeholder']){if(!node.hasAttribute(key))continue;let records=attributes.get(node);if(!records){records={};attributes.set(node,records);}const old=records[key],value=node.getAttribute(key),raw=old&&old.last===value?old.raw:value,next=text(raw);records[key]={raw,last:next};if(next!==value)node.setAttribute(key,next);}for(const child of node.childNodes)visit(child);}};
 localeSession.redraw=()=>{cache.clear();visit(document.body);};
 const start=()=>{localeSession.pendingStart=false;if(localeSession.observer)return;visit(document.body);localeSession.observer=new MutationObserver(records=>{for(const record of records){if(record.type==='childList'){for(const node of record.addedNodes)visit(node);}else visit(record.target);}});localeSession.observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}
